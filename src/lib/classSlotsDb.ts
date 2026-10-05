import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  BatchGetCommand,
  DynamoDBDocumentClient,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

// AWS region/credentials are read from server env (AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, etc.)
const REGION = process.env.AWS_REGION || 'us-east-1';

// DynamoDB table tracking live booked-seat counts per class time slot, keyed by
// (businessId, classTimeId). Separate from SC-Orders because it needs atomic
// conditional increments to prevent overbooking — a plain S3 JSON write can't do that.
export const CLASS_SLOTS_TABLE = process.env.DDB_CLASS_SLOTS_TABLE || 'SC-ClassSlots';

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

export class SlotFullError extends Error {
  constructor(public classTimeId: string) {
    super(`Class time ${classTimeId} does not have enough seats left`);
    this.name = 'SlotFullError';
  }
}

/**
 * Atomically reserves `qty` seats for a class time slot, failing if that would
 * exceed `capacity`. If `capacity` is undefined/null, the slot is unlimited and
 * this always succeeds (still records the booked count for visibility).
 */
export async function reserveSeats(
  businessId: string,
  classTimeId: string,
  qty: number,
  capacity: number | undefined
): Promise<void> {
  if (qty <= 0) return;

  if (typeof capacity !== 'number' || !Number.isFinite(capacity)) {
    await ddb.send(
      new UpdateCommand({
        TableName: CLASS_SLOTS_TABLE,
        Key: { businessId, classTimeId },
        UpdateExpression: 'ADD bookedCount :qty SET updatedAt = :now',
        ExpressionAttributeValues: { ':qty': qty, ':now': new Date().toISOString() },
      })
    );
    return;
  }

  // A booking that alone exceeds capacity can never succeed — reject up front.
  // (Without this, "attribute_not_exists(bookedCount)" below would wrongly let a
  // slot's very first reservation through even if qty > capacity, since the OR
  // short-circuits before the room check on a brand-new item.)
  if (qty > capacity) {
    throw new SlotFullError(classTimeId);
  }

  const room = capacity - qty;
  try {
    await ddb.send(
      new UpdateCommand({
        TableName: CLASS_SLOTS_TABLE,
        Key: { businessId, classTimeId },
        UpdateExpression: 'ADD bookedCount :qty SET updatedAt = :now',
        ConditionExpression: 'attribute_not_exists(bookedCount) OR bookedCount <= :room',
        ExpressionAttributeValues: { ':qty': qty, ':room': room, ':now': new Date().toISOString() },
      })
    );
  } catch (err: unknown) {
    const name = err && typeof err === 'object' && 'name' in err ? (err as { name?: string }).name : undefined;
    if (name === 'ConditionalCheckFailedException') {
      throw new SlotFullError(classTimeId);
    }
    throw err;
  }
}

/** Releases `qty` previously-reserved seats (order cancelled/deleted), floored at 0. */
export async function releaseSeats(businessId: string, classTimeId: string, qty: number): Promise<void> {
  if (qty <= 0) return;
  await ddb.send(
    new UpdateCommand({
      TableName: CLASS_SLOTS_TABLE,
      Key: { businessId, classTimeId },
      UpdateExpression: 'ADD bookedCount :negQty SET updatedAt = :now',
      ExpressionAttributeValues: { ':negQty': -qty, ':now': new Date().toISOString() },
    })
  );
  // Floor at 0 in case of double-release races; best-effort, not itself atomic.
  await ddb.send(
    new UpdateCommand({
      TableName: CLASS_SLOTS_TABLE,
      Key: { businessId, classTimeId },
      UpdateExpression: 'SET bookedCount = :zero',
      ConditionExpression: 'attribute_exists(bookedCount) AND bookedCount < :zero',
      ExpressionAttributeValues: { ':zero': 0 },
    })
  ).catch(() => {
    // Condition not met (count wasn't negative) — nothing to fix.
  });
}

/** Batch-reads current booked counts for a set of class times (missing rows = 0 booked). */
export async function getBookedCounts(
  businessId: string,
  classTimeIds: string[]
): Promise<Record<string, number>> {
  const ids = [...new Set(classTimeIds.filter(Boolean))];
  const result: Record<string, number> = {};
  if (ids.length === 0) return result;

  // BatchGet caps at 100 keys per call.
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const res = await ddb.send(
      new BatchGetCommand({
        RequestItems: {
          [CLASS_SLOTS_TABLE]: {
            Keys: chunk.map((classTimeId) => ({ businessId, classTimeId })),
          },
        },
      })
    );
    const rows = res.Responses?.[CLASS_SLOTS_TABLE] ?? [];
    for (const row of rows) {
      result[row.classTimeId as string] = (row.bookedCount as number) ?? 0;
    }
  }
  for (const id of ids) if (!(id in result)) result[id] = 0;
  return result;
}
