import { integer, pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core"

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  tx_hash: text("tx_hash").notNull().unique(),
  chain: text("chain").notNull(),
  token: text("token").notNull(),
  from: text("from").notNull(),
  to: text("to").notNull(),
  amount_received: text("amount").notNull(),
  status: text("status").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
})

export const transactionLogsTable = pgTable("transaction_logs", {
  id: serial("id").primaryKey(),
  transaction_tx_hash: text("transaction_tx_hash")
    .notNull()
    .references(() => transactionsTable.tx_hash, { onDelete: "cascade" }),
  log: jsonb("log").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
})

export const clientTransactionLogsTable = pgTable("client_transaction_logs", {
  id: serial("id").primaryKey(),
  account_address: text("account_address").notNull(),
  transaction_tx_hash: text("transaction_tx_hash"),
  chain: text("chain"),
  token: text("token"),
  log: jsonb("log"),
  created_at: timestamp("created_at").notNull().defaultNow(),
})

export type InsertTransaction = typeof transactionsTable.$inferInsert
export type SelectTransaction = typeof transactionsTable.$inferSelect

export type InsertTransactionLog = typeof transactionLogsTable.$inferInsert
export type SelectTransactionLog = typeof transactionLogsTable.$inferSelect

export type InsertClientTransactionLog = typeof clientTransactionLogsTable.$inferInsert
export type SelectClientTransactionLog = typeof clientTransactionLogsTable.$inferSelect
