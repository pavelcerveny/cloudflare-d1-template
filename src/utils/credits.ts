import "server-only";
import { eq, sql, desc, and, lt, isNull, gt, or, asc } from "drizzle-orm";
import { getDB } from "@/db";
import { users, creditTransactionTable, CREDIT_TRANSACTION_TYPE, purchasedItemsTable } from "@/db/schema";
import { CREDIT_PACKAGES, FREE_MONTHLY_CREDITS } from "@/constants";
import { CurrentSession } from "./auth";

export type CreditPackage = typeof CREDIT_PACKAGES[number];

// TODO Update the Readme before merging the credit system

export function getCreditPackage(packageId: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((pkg) => pkg.id === packageId);
}

function shouldRefreshCredits(session: CurrentSession, currentTime: Date): boolean {
  // Check if it's been at least a month since last refresh
  if (!session.user?.lastCreditRefreshAt) {
    return true;
  }

  // Check if the month or year has changed since last refresh
  return (
    session.user.lastCreditRefreshAt.getMonth() !== currentTime.getMonth() ||
    session.user.lastCreditRefreshAt.getFullYear() !== currentTime.getFullYear()
  );
}

async function processExpiredCredits(userId: string, currentTime: Date) {
  const db = await getDB();
  // Find all expired transactions that haven't been processed and have remaining credits
  // Order by type to process MONTHLY_REFRESH first, then by creation date
  const expiredTransactions = await db.query.creditTransactionTable.findMany({
    where: and(
      eq(creditTransactionTable.userId, userId),
      lt(creditTransactionTable.expirationDate, currentTime),
      isNull(creditTransactionTable.expirationDateProcessedAt),
      gt(creditTransactionTable.remainingAmount, 0),
    ),
    orderBy: [
      // Process MONTHLY_REFRESH transactions first
      desc(sql`CASE WHEN ${creditTransactionTable.type} = ${CREDIT_TRANSACTION_TYPE.MONTHLY_REFRESH} THEN 1 ELSE 0 END`),
      // Then process by creation date (oldest first)
      asc(creditTransactionTable.createdAt),
    ],
  });

  // Process each expired transaction
  for (const transaction of expiredTransactions) {
    try {
      // First, mark the transaction as processed to prevent double processing
      await db
        .update(creditTransactionTable)
        .set({
          expirationDateProcessedAt: currentTime,
          remainingAmount: 0, // All remaining credits are expired
        })
        .where(eq(creditTransactionTable.id, transaction.id));

      // Then deduct the expired credits from user's balance
      await db
        .update(users)
        .set({
          currentCredits: sql`${users.currentCredits} - ${transaction.remainingAmount}`,
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error(`Failed to process expired credits for transaction ${transaction.id}:`, error);
      continue;
    }
  }
}

export async function updateUserCredits(userId: string, creditsToAdd: number) {
  const db = await getDB();
  await db
    .update(users)
    .set({
      currentCredits: sql`${users.currentCredits} + ${creditsToAdd}`,
    })
    .where(eq(users.id, userId));

  // Update all KV sessions to reflect the new credit balance
 //  await updateAllSessionsOfUser(userId);
}

async function updateLastRefreshDate(userId: string, date: Date) {
  const db = await getDB();
  await db
    .update(users)
    .set({
      lastCreditRefreshAt: date,
    })    
    .where(eq(users.id, userId));
}

export async function logTransaction(
  userId: string,
  amount: number,
  description: string,
  type: keyof typeof CREDIT_TRANSACTION_TYPE,
  expirationDate?: Date
) {
  const db = await getDB();
  await db
    .insert(creditTransactionTable)
    .values({
      userId,
      amount,
      remainingAmount: amount, // Initialize remaining amount to be the same as amount
      type,
    description,
    createdAt: new Date(),
    updatedAt: new Date(),
    expirationDate,
  });
}

export async function addFreeMonthlyCreditsIfNeeded(session: CurrentSession): Promise<number> {
  const currentTime = new Date();

  // Check if it's been at least a month since last refresh
  if (shouldRefreshCredits(session, currentTime)) {
    // Double check the last refresh date from the database to prevent race conditions
    const db = await getDB();
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user?.id ?? ""),
      columns: {
        lastCreditRefreshAt: true,
        currentCredits: true,
      },
    });

    // This should prevent race conditions between multiple sessions
    if (!shouldRefreshCredits({ ...session, user: { ...session.user, lastCreditRefreshAt: user?.lastCreditRefreshAt ?? null } }, currentTime)) {
      return user?.currentCredits ?? 0;
    }

    // Process any expired credits first
    await processExpiredCredits(session.user?.id ?? "", currentTime);

    // Add free monthly credits with 1 month expiration
    const expirationDate = new Date(currentTime);
    expirationDate.setMonth(expirationDate.getMonth() + 1);

    await updateUserCredits(session.user?.id ?? "", FREE_MONTHLY_CREDITS);
    await logTransaction(
      session.user?.id ?? "",
      FREE_MONTHLY_CREDITS,
      'Free monthly credits',
      CREDIT_TRANSACTION_TYPE.MONTHLY_REFRESH,
      expirationDate
    );

    // Update last refresh date
    await updateLastRefreshDate(session.user?.id ?? "", currentTime);

    // Get the updated credit balance from the database
    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, session.user?.id ?? ""),
      columns: {
        currentCredits: true,
      },
    });

    return updatedUser?.currentCredits ?? 0;
  }

  return session.user?.currentCredits ?? 0;
}

export async function hasEnoughCredits({ userId, requiredCredits }: { userId: string; requiredCredits: number }) {
  const db = await getDB();
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      currentCredits: true,
    }
  });
  if (!user) return false;

  return user.currentCredits >= requiredCredits;
}

export async function useCredits({ userId, amount, description }: { userId: string; amount: number; description: string }) {
  const db = await getDB();

  // First check if user has enough credits
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      currentCredits: true,
    },
  });

  if (!user || user.currentCredits < amount) {
    throw new Error("Insufficient credits");
  }

  // Get all non-expired transactions with remaining credits, ordered by creation date
  const activeTransactionsWithBalance = await db.query.creditTransactionTable.findMany({
    where: and(
      eq(creditTransactionTable.userId, userId),
      gt(creditTransactionTable.remainingAmount, 0),
      isNull(creditTransactionTable.expirationDateProcessedAt),
      or(
        isNull(creditTransactionTable.expirationDate),
        gt(creditTransactionTable.expirationDate, new Date())
      )
    ),
    orderBy: [asc(creditTransactionTable.createdAt)],
  });

  let remainingToDeduct = amount;

  // Deduct from each transaction until we've deducted the full amount
  for (const transaction of activeTransactionsWithBalance) {
    if (remainingToDeduct <= 0) break;

    const deductFromThis = Math.min(transaction.remainingAmount, remainingToDeduct);

    await db
      .update(creditTransactionTable)
      .set({
        remainingAmount: transaction.remainingAmount - deductFromThis,
      })
      .where(eq(creditTransactionTable.id, transaction.id));

    remainingToDeduct -= deductFromThis;
  }

  // Update total credits
  await db
    .update(users)
    .set({
      currentCredits: sql`${users.currentCredits} - ${amount}`,
    })
    .where(eq(users.id, userId));

  // Log the usage transaction
  await db.insert(creditTransactionTable).values({
    userId,
    amount: -amount,
    remainingAmount: 0, // Usage transactions don't have remaining amount
    type: CREDIT_TRANSACTION_TYPE.USAGE,
    description,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Get updated credit balance
  const updatedUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      currentCredits: true,
    },
  });

  // Update all KV sessions to reflect the new credit balance
  // await updateAllSessionsOfUser(userId);

  return updatedUser?.currentCredits ?? 0;
}

export async function getCreditTransactions({
  userId,
  page = 1,
  limit = 10
}: {
  userId: string;
  page?: number;
  limit?: number;
}) {
  const db = await getDB();
  const transactions = await db.query.creditTransactionTable.findMany({
    where: eq(creditTransactionTable.userId, userId),
    orderBy: [desc(creditTransactionTable.createdAt)],
    limit,
    offset: (page - 1) * limit,
    columns: {
      expirationDateProcessedAt: false,
      remainingAmount: false,
      userId: false,
    }
  });

  const total = await db
    .select({ count: sql<number>`count(*)` })
    .from(creditTransactionTable)
    .where(eq(creditTransactionTable.userId, userId))
    .then((result) => result[0].count);

  return {
    transactions,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      current: page,
    },
  };
}

export async function getUserPurchasedItems(userId: string) {
  const db = await getDB();
  const purchasedItems = await db.query.purchasedItemsTable.findMany({
    where: eq(purchasedItemsTable.userId, userId),
  });

  // Create a map of purchased items for easy lookup
  return new Set(
    purchasedItems.map(item => `${item.itemType}:${item.itemId}`)
  );
}
