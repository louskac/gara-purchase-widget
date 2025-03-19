"use client"

import { type ReactNode, createContext, useRef, useContext } from "react"
import { useStore } from "zustand"

import { type GaraStore, createGaraStore } from "."

export type GaraStoreApi = ReturnType<typeof createGaraStore>

export const GaraStoreContext = createContext<GaraStoreApi | undefined>(undefined)

export interface GaraStoreProviderProps {
  children: ReactNode
}

export const GaraStoreProvider = ({ children }: GaraStoreProviderProps) => {
  const storeRef = useRef<GaraStoreApi>()
  if (!storeRef.current) {
    storeRef.current = createGaraStore()
  }

  return <GaraStoreContext.Provider value={storeRef.current}>{children}</GaraStoreContext.Provider>
}

export const useGaraStore = <T,>(selector: (store: GaraStore) => T): T => {
  const garaStoreContext = useContext(GaraStoreContext)

  if (!garaStoreContext) {
    throw new Error(`useGaraStore must be used within GaraStoreProvider`)
  }

  return useStore(garaStoreContext, selector)
}
