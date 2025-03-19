import { HexAddress, SupportedChains, SupportedTokens } from "../types"

const COINGARAGE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_COINGARAGE_ADDRESS as `0x${string}`
const USDC_POLYGON_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_USDC_POLYGON_CONTRACT_ADDRESS as `0x${string}`
const USDC_ETHEREUM_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_USDC_ETHEREUM_CONTRACT_ADDRESS as `0x${string}`
const USDC_BSC_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_USDC_BSC_CONTRACT_ADDRESS as `0x${string}`
const USDT_POLYGON_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_USDT_POLYGON_CONTRACT_ADDRESS as `0x${string}`
const USDT_ETHEREUM_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_USDT_ETHEREUM_CONTRACT_ADDRESS as `0x${string}`
const USDT_BSC_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_USDT_BSC_CONTRACT_ADDRESS as `0x${string}`
const ETH_ETH_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ETH_ETH_CONTRACT_ADDRESS as `0x${string}`

export type SupportedTokens = "ETH" | "POL" | "BNB" | "USDT" | "USDC";

export type ContractAddresses = {
  [token in SupportedTokens]: {
    Polygon: `0x${string}`;
    Ethereum: `0x${string}`;
    "BNB Smart Chain": `0x${string}`;
  }
};

export const contractAddresses: ContractAddresses = {
  USDC: {
    Polygon: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    Ethereum: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "BNB Smart Chain": "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  },
  USDT: {
    Polygon: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    Ethereum: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "BNB Smart Chain": "0x55d398326f99059fF775485246999027B3197955",
  },
  ETH: {
    Polygon: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    Ethereum: "0x34Bb47732aF26EC7fF493a49694342945090a7F7",
    "BNB Smart Chain": "0x55d398326f99059fF775485246999027B3197955",
  },
  POL: {
    Polygon: "0x34Bb47732aF26EC7fF493a49694342945090a7F7",
    Ethereum: "0x34Bb47732aF26EC7fF493a49694342945090a7F7",
    "BNB Smart Chain": "0x55d398326f99059fF775485246999027B3197955",
  },
}

export const getUsdcOnChain = (chain: any) => {
  switch (chain) {
    case "Polygon":
      return USDC_POLYGON_CONTRACT_ADDRESS
    case "Ethereum":
      return USDC_ETHEREUM_CONTRACT_ADDRESS
    case "BNB Smart Chain":
      return USDC_BSC_CONTRACT_ADDRESS
    default:
      return USDC_POLYGON_CONTRACT_ADDRESS
  }
}
