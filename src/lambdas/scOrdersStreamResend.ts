import crypto from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { Resend } from '@resend/node';
import { buildBusinessEmail, buildCustomerEmail } from '../lib/orderEmails';

type DynamoDbImage = Record<string, unknown>;

type DynamoDbStreamRecord = {
  eventName?: 'INSERT' | 'MODIFY' | 'REMOVE' | string;
  dynamodb?: {
    NewImage?: DynamoDbImage;
    Keys?: DynamoDbImage;
  };
};

type DynamoDbStreamEvent = {
  Records?: DynamoDbStreamRecord[];
};

const REGION = process.env.AWS_REGION || 'us-east-1';
const ORDERS_TABLE = process.env.DDB_ORDERS_TABLE || 'SC-Orders';

const dynamo = new DynamoDBClient({ region: REGION });
const ddb = DynamoDBDocumentClient.from(dynamo, {
  marshallOptions: { removeUndefinedValues: true },
});

function conditionalCheckFailed(err: unknown): boolean {
  return (
    !!err &&
    typeof err === 'object' &&
    'name' in err &&
    (err as { name?: unknown }).name === 'ConditionalCheckFailedException'
  );
}

function safeUnmarshall(image: DynamoDbImage): Record<string, unknown> {
  try {
    return unmarshall(image as never) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function shouldProcessRecord(record: DynamoDbStreamRecord): boolean {
  return record.eventName === 'INSERT' || record.eventName === 'MODIFY';
}

function extractKeys(record: DynamoDbStreamRecord, order: Record<string, unknown>): {
  businessId: string;
  createdAtOrderId: string;
} | null {
  const keysObj = record.dynamodb?.Keys ? safeUnmarshall(record.dynamodb.Keys) : null;
  const businessId =
    (typeof keysObj?.businessId === 'string' ? keysObj.businessId : null) ??
    (typeof order.businessId === 'string' ? (order.businessId as string) : '');
  const createdAtOrderId =
    (typeof keysObj?.createdAtOrderId === 'string' ? keysObj.createdAtOrderId : null) ??
    (typeof order.createdAtOrderId === 'string' ? (order.createdAtOrderId as string) : '');

  if (!businessId || !createdAtOrderId) return null;
  return { businessId, createdAtOrderId };
}

async function claimEmailSend(keys: { businessId: string; createdAtOrderId: string }): Promise<boolean> {
  const emailSendLockId = crypto.randomUUID();
  const ts = new Date().toISOString();
  try {
    await ddb.send(
      new UpdateCommand({
        TableName: ORDERS_TABLE,
        Key: keys,
        UpdateExpression: 'SET emailSendLockId = :lock, emailSendLockAt = :ts',
        ExpressionAttributeValues: { ':lock': emailSendLockId, ':ts': ts },
        ConditionExpression:
          'attribute_not_exists(emailSentAt) AND attribute_not_exists(emailSendLockId)',
      })
    );
    return true;
  } catch (err) {
    if (conditionalCheckFailed(err)) return false;
    throw err;
  }
}

async function sendViaResend(
  resend: Resend,
  params: {
    kind: 'customer' | 'business';
    message: { to: string; from: string; replyTo: string; subject: string; html: string };
    context?: { businessId?: string; createdAtOrderId?: string; orderId?: string };
  }
): Promise<void> {
  const { kind, message, context } = params;
  const startedAt = Date.now();
  try {
    console.log('[orders-email] sending', {
      kind,
      to: message.to,
      from: message.from,
      subject: message.subject,
      context,
    });

    const resp = await resend.emails.send({
      to: message.to,
      from: message.from,
      subject: message.subject,
      html: message.html,
      replyTo: message.replyTo,
    });

    console.log('[orders-email] resend raw resp', resp);

    const ms = Date.now() - startedAt;
    const data = (resp as { data?: unknown }).data as { id?: unknown } | undefined;
    const error = (resp as { error?: unknown }).error as
      | ({ message?: unknown; statusCode?: unknown } & Record<string, unknown>)
      | undefined;

    if (error) {
      console.error('[orders-email] resend error response', {
        kind,
        ms,
        statusCode: typeof error.statusCode === 'number' ? error.statusCode : undefined,
        message: typeof error.message === 'string' ? error.message : undefined,
        context,
      });
      throw new Error(
        `Resend send failed (${typeof error.statusCode === 'number' ? error.statusCode : 'unknown'}): ${
          typeof error.message === 'string' ? error.message : JSON.stringify(error)
        }`
      );
    }

    console.log('[orders-email] resend response', {
      kind,
      ms,
      id: typeof data?.id === 'string' ? data.id : undefined,
      context,
    });
  } catch (err) {
    const ms = Date.now() - startedAt;
    console.error('[orders-email] resend threw', { kind, ms, context, err });
    throw err;
  }
}

async function processInsertRecord(record: DynamoDbStreamRecord, resend: Resend): Promise<void> {
  const newImage = record.dynamodb?.NewImage;
  if (!newImage) return;

  const order = safeUnmarshall(newImage);
  const keys = extractKeys(record, order);
  console.log('[orders-email] extracted keys', {
    keys,
    orderBusinessId: typeof order.businessId === 'string' ? order.businessId : undefined,
    orderCreatedAtOrderId:
      typeof order.createdAtOrderId === 'string' ? order.createdAtOrderId : undefined,
    orderId: typeof order.orderId === 'string' ? order.orderId : undefined,
  });
  if (!keys) {
    console.warn('[orders-email] missing keys; skipping', { hasNewImage: true });
    return;
  }

  try {
    await ddb.send(
      new UpdateCommand({
        TableName: ORDERS_TABLE,
        Key: keys,
        UpdateExpression: 'SET debugEmailLambdaTouchedAt = :ts',
        ExpressionAttributeValues: { ':ts': new Date().toISOString() },
        ConditionExpression: 'attribute_exists(businessId) AND attribute_exists(createdAtOrderId)',
      })
    );
    console.log('[orders-email] touched item', { keys, ORDERS_TABLE });
  } catch (err) {
    if (conditionalCheckFailed(err)) {
      console.error('[orders-email] touch failed (item not found?)', { keys, ORDERS_TABLE });
    } else {
      console.error('[orders-email] touch failed', { keys, ORDERS_TABLE, err });
    }
  }

  console.log('[orders-email] attempting claim', { keys });
  const claimed = await claimEmailSend(keys);
  console.log('[orders-email] claim result', { claimed, keys });
  if (!claimed) {
    console.log('[orders-email] duplicate stream event; already claimed', keys);
    return;
  }

  const customerEmail = buildCustomerEmail({ order });
  const businessEmail = buildBusinessEmail({ order });

  if (!customerEmail || !businessEmail) {
    console.error('[orders-email] missing required email fields; cannot send', {
      businessId: keys.businessId,
      createdAtOrderId: keys.createdAtOrderId,
      hasCustomerEmail: !!customerEmail,
      hasBusinessEmail: !!businessEmail,
    });
    return;
  }

  const context = {
    businessId: keys.businessId,
    createdAtOrderId: keys.createdAtOrderId,
    orderId: typeof order.orderId === 'string' ? order.orderId : undefined,
  };

  await sendViaResend(resend, { kind: 'customer', message: customerEmail, context });
  await sendViaResend(resend, { kind: 'business', message: businessEmail, context });

  await ddb.send(
    new UpdateCommand({
      TableName: ORDERS_TABLE,
      Key: keys,
      UpdateExpression: 'SET emailSentAt = :ts REMOVE emailSendLockId, emailSendLockAt',
      ExpressionAttributeValues: { ':ts': new Date().toISOString() },
    })
  );

  console.log('[orders-email] sent', {
    businessId: keys.businessId,
    createdAtOrderId: keys.createdAtOrderId,
    orderId: typeof order.orderId === 'string' ? order.orderId : undefined,
  });
}

/**
 * DynamoDB Streams (NEW_IMAGE) handler for SC-Orders transactional emails.
 * - INSERT only
 * - Idempotent via conditional UpdateItem (emailSentAt)
 */
export async function handler(event: DynamoDbStreamEvent): Promise<void> {
  console.log('[orders-email] handler start', {
    REGION,
    ORDERS_TABLE,
    node: process.version,
    hasRecords: Array.isArray(event?.Records),
    recordCount: Array.isArray(event?.Records) ? event.Records.length : 0,
    eventNames: Array.isArray(event?.Records) ? event.Records.map((r) => r.eventName) : [],
  });

  const records = Array.isArray(event?.Records) ? event.Records : [];
  if (!records.length) return;

  console.log('[orders-email] env present?', {
    hasResendKey: !!process.env.RESEND_API_KEY,
    ddbOrdersTableEnv: process.env.DDB_ORDERS_TABLE,
    awsRegionEnv: process.env.AWS_REGION,
  });

  const apiKey = process.env.RESEND_API_KEY || '';
  if (!apiKey) {
    console.error('[orders-email] missing RESEND_API_KEY; skipping batch');
    return;
  }

  const resend = new Resend(apiKey);

  const results = await Promise.allSettled(
    records.map(async (record) => {
      try {
        console.log('[orders-email] record received', {
          eventName: record.eventName,
          hasNewImage: !!record.dynamodb?.NewImage,
          hasKeys: !!record.dynamodb?.Keys,
        });

        if (!shouldProcessRecord(record)) return;
        await processInsertRecord(record, resend);
      } catch (err) {
        console.error('[orders-email] record failed', err);
        throw err;
      }
    })
  );

  const failures = results.filter((r) => r.status === 'rejected').length;
  if (failures) {
    console.error('[orders-email] unexpected failures in batch', { failures });
  }
}
