"use server"

import { createClientTransactionLog } from "./db/helpers"
import { InsertClientTransactionLog } from "./db/schema"

export const writeClientTransactionLog = async ({
  account_address,
  transaction_tx_hash,
  chain,
  token,
  log,
}: InsertClientTransactionLog) => {
  try {
    const response = await createClientTransactionLog({
      account_address,
      transaction_tx_hash,
      chain,
      token,
      log,
    })

    return { success: true }
  } catch (error) {
    console.error("Error creating client transaction log:", error)
    return { success: false, message: error?.message || "Unknown error" }
  }
}
