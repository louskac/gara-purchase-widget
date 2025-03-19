"use client"

import { ReactNode } from "react"
import { getDefaultConfig, RainbowKitProvider, darkTheme, connectorsForWallets } from "@rainbow-me/rainbowkit"
import {
  metaMaskWallet,
  coinbaseWallet,
  rainbowWallet,
  walletConnectWallet,
  trustWallet,
  phantomWallet,
} from "@rainbow-me/rainbowkit/wallets"
import { WagmiProvider, cookieStorage, createConfig, createStorage, http, type Locale } from "wagmi"
import { polygon, mainnet, bsc, sepolia, bscTestnet } from "wagmi/chains"
import { GaraStoreProvider } from "../lib/store/provider"
import { getRpcNode } from "../utils/utils"

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [metaMaskWallet],
    },
    {
      groupName: "Other",
      wallets: [rainbowWallet, walletConnectWallet, coinbaseWallet, phantomWallet].filter(
        (wallet) => wallet !== trustWallet
      ),
    },
  ],
  {
    appName: "PenguinPresale",
    projectId: process.env.NEXT_PUBLIC_CONNECT_WALLET_PROJECT_ID,
  }
)
export const config = getDefaultConfig({
  appName: "PenguinPresale",
  connectors,
  projectId: process.env.NEXT_PUBLIC_CONNECT_WALLET_PROJECT_ID,
  chains: [polygon, mainnet, bsc], //monda
  transports: {
    [mainnet.id]: getRpcNode(mainnet.name),
    [polygon.id]: getRpcNode(polygon.name),
    [bsc.id]: getRpcNode(bsc.name),
  },
  ssr: true,
  logging: true, // Enable logging for debugging
  storage: createStorage({
    storage: cookieStorage,
  }),
})

export const WalletProviders = ({ children, locale }: { children: ReactNode; locale: Locale }) => {
  return (
    <GaraStoreProvider>
      <WagmiProvider config={config}>
        <RainbowKitProvider theme={darkTheme()} locale={locale}>
          {children}
        </RainbowKitProvider>
      </WagmiProvider>
    </GaraStoreProvider>
  )
}
