import crypto from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import type { OrderRecord, OrderItem } from '@/types/orders';

// AWS region/credentials are read from server env (AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, etc.)
const REGION = process.env.AWS_REGION || 'us-east-1';

// DynamoDB table name for orders (override via env only if needed)
export const ORDERS_TABLE = process.env.DDB_ORDERS_TABLE || 'SC-Orders';

const client = new DynamoDBClient({
  region: REGION,
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        }
      : undefined,
});

const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

export type CreateOrderInput = {
  businessId: string;
  customerEmail: string;
  customerName?: string;
  items: OrderItem[];
  total: number;
  currency: string;
  status?: string;
  notes?: string;
  [key: string]: unknown;
};

export type ListOrdersOptions = {
  fromISO?: string;
  toISO?: string;
  limit?: number;
  nextToken?: string;
  scanForward?: boolean;
};

const TTL_SECONDS = 7 * 24 * 60 * 60;

function encodeNextToken(key?: Record<string, unknown>): string | null {
  if (!key) return null;
  return Buffer.from(JSON.stringify(key)).toString('base64url');
}

function decodeNextToken(token?: string): Record<string, unknown> | undefined {
  if (!token) return undefined;
  try {
    return JSON.parse(Buffer.from(token, 'base64url').toString('utf-8')) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

export async function createOrder(input: CreateOrderInput): Promise<OrderRecord> {
  const createdAt = new Date().toISOString();
  const orderId = crypto.randomUUID();
  const createdAtOrderId = `${createdAt}#${orderId}`;
  const expiresAt = Math.floor(Date.parse(createdAt) / 1000 + TTL_SECONDS);
  const status = input.status?.trim() || 'PLACED';

  const {
    businessId,
    customerEmail,
    customerName,
    items,
    total,
    currency,
    ...rest
  } = input;

  const record: OrderRecord = {
    ...rest,
    businessId,
    orderId,
    createdAt,
    createdAtOrderId,
    expiresAt,
    status,
    customerEmail,
    customerName,
    items,
    total,
    currency,
  };

  await ddb.send(
    new PutCommand({
      TableName: ORDERS_TABLE,
      Item: record,
      ConditionExpression: 'attribute_not_exists(businessId) AND attribute_not_exists(createdAtOrderId)',
    })
  );

  return record;
}

export async function getOrder(
  businessId: string,
  createdAtOrderId: string
): Promise<OrderRecord | null> {
  const res = await ddb.send(
    new GetCommand({
      TableName: ORDERS_TABLE,
      Key: { businessId, createdAtOrderId },
    })
  );
  return (res.Item as OrderRecord) ?? null;
}

export async function listOrdersByBusiness(
  businessId: string,
  options: ListOrdersOptions = {}
): Promise<{ items: OrderRecord[]; nextToken: string | null }> {
  const biz = (businessId || '').trim();
  if (!biz) {
    return { items: [], nextToken: null };
  }
  const limit = typeof options.limit === 'number' ? options.limit : 25;
  const scanForward = options.scanForward ?? false;
  const fromISO = options.fromISO || '0000-01-01T00:00:00.000Z';
  const toISO = options.toISO || '9999-12-31T23:59:59.999Z';
  const fromKey = `${fromISO}#`;
  const toKey = `${toISO}#\uffff`;

  const res = await ddb.send(
    new QueryCommand({
      TableName: ORDERS_TABLE,
      KeyConditionExpression:
        'businessId = :b AND createdAtOrderId BETWEEN :fromKey AND :toKey',
      ExpressionAttributeValues: {
        ':b': biz,
        ':fromKey': fromKey,
        ':toKey': toKey,
      },
      Limit: limit,
      ScanIndexForward: scanForward,
      ExclusiveStartKey: decodeNextToken(options.nextToken),
    })
  );

  return {
    items: (res.Items as OrderRecord[]) ?? [],
    nextToken: encodeNextToken(res.LastEvaluatedKey as Record<string, unknown> | undefined),
  };
}

export async function updateOrderStatus(
  businessId: string,
  createdAtOrderId: string,
  status: string
): Promise<void> {
  await ddb.send(
    new UpdateCommand({
      TableName: ORDERS_TABLE,
      Key: { businessId, createdAtOrderId },
      UpdateExpression: 'SET #status = :s',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':s': status },
    })
  );
}

export async function deleteOrder(
  businessId: string,
  createdAtOrderId: string
): Promise<void> {
  await ddb.send(
    new DeleteCommand({
      TableName: ORDERS_TABLE,
      Key: { businessId, createdAtOrderId },
    })
  );
}
