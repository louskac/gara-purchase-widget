import { HexAddress } from "../../types"
import { createStore } from "zustand/vanilla"

export type GaraState = {
  transactionStatus: {
    process: string
    status: string
  }
  outcomingTransaction: {
    txHash: HexAddress | undefined
    done: boolean
    receipt: any
    error: any
  }
  incomingTransaction: {
    txHash: HexAddress | undefined
    done: boolean
    receipt: any
    error: any
  }
}

export type GaraActios = {
  setTransactionStatus: (transactionStatus: { process: string; status: string }) => void
  setOutcomingTransaction: (outcomingTransaction: {
    txHash?: HexAddress
    done?: boolean
    receipt?: any
    error?: any
  }) => void
  setIncomingTransaction: (incomingTransaction: {
    txHash?: HexAddress
    done?: boolean
    receipt?: any
    error?: any
  }) => void
  reset: () => void
}

export type GaraStore = GaraState & GaraActios

export const defaultInitState: GaraState = {
  transactionStatus: {
    process: "sendPayment",
    status: "pending",
  },
  outcomingTransaction: {
    txHash: undefined,
    done: false,
    receipt: undefined,
    error: undefined,
  },
  incomingTransaction: {
    txHash: undefined,
    done: false,
    receipt: undefined,
    error: undefined,
  },
}

export const createGaraStore = (initState: GaraState = defaultInitState) => {
  return createStore<GaraStore>()((set, get) => ({
    ...initState,
    setTransactionStatus: ({ process, status }) =>
      set({ transactionStatus: { ...initState.transactionStatus, process, status } }),
    setOutcomingTransaction: (outcomingTransaction) =>
      set({ ...get(), outcomingTransaction: { ...get().outcomingTransaction, ...outcomingTransaction } }),
    setIncomingTransaction: (incomingTransaction) =>
      set({ ...get(), incomingTransaction: { ...get().incomingTransaction, ...incomingTransaction } }),
    reset: () => set(defaultInitState),
  }))
}
