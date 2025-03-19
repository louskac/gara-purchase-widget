import { asc, between, count, eq, getTableColumns, sql } from "drizzle-orm"

import { db } from "./drizzle"
import {
  InsertTransaction,
  InsertTransactionLog,
  transactionsTable,
  transactionLogsTable,
  SelectTransaction,
  InsertClientTransactionLog,
  clientTransactionLogsTable,
} from "./schema"

export async function createTransaction(data: InsertTransaction) {
  await db.insert(transactionsTable).values(data)
}

export async function getTransactionByTxHash(txHash: SelectTransaction["tx_hash"]): Promise<SelectTransaction[]> {
  return await db.select().from(transactionsTable).where(eq(transactionsTable.tx_hash, txHash))
}

export async function updateTransactionByTxHash(
  txHash: SelectTransaction["tx_hash"],
  data: Partial<Omit<SelectTransaction, "tx_hash">>
) {
  await db
    .update(transactionsTable)
    .set({
      ...data,
      updated_at: sql`NOW()`,
    })
    .where(eq(transactionsTable.tx_hash, txHash))
}

export async function createTransactionLog(data: InsertTransactionLog) {
  await db.insert(transactionLogsTable).values(data)
}

export async function createClientTransactionLog(data: InsertClientTransactionLog) {
  await db.insert(clientTransactionLogsTable).values(data)
}
