import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { polygon, mainnet, sepolia, bsc, bscTestnet, type Chain } from "viem/chains"
import { BigNumberish, HexAddress } from "../types"
import { createPublicClient, decodeFunctionData, http, parseAbi, parseEther, parseUnits } from "viem"
import { sendMail } from "../lib/mailer"

const priceTable = [
  { start: "2025-01-27", end: "2025-02-23", price: 0.12 },
  { start: "2025-02-24", end: "2025-03-02", price: 0.13 },
  { start: "2025-03-03", end: "2025-03-09", price: 0.14 },
  { start: "2025-03-10", end: "2025-03-16", price: 0.15 },
  { start: "2025-03-17", end: "2025-03-23", price: 0.16 },
  { start: "2025-03-24", end: "2025-03-30", price: 0.17 },
  { start: "2025-03-31", end: "2025-04-06", price: 0.18 },
  { start: "2025-04-07", end: "2025-04-13", price: 0.19 },
  { start: "2025-04-14", end: "2025-04-20", price: 0.20 },
  { start: "2025-04-21", end: "2025-04-27", price: 0.21 },
  { start: "2025-04-28", end: "2025-05-04", price: 0.22 },
  { start: "2025-05-05", end: "2025-05-11", price: 0.23 },
  { start: "2025-05-12", end: "2025-05-18", price: 0.24 },
  { start: "2025-05-19", end: "2025-05-25", price: 0.25 },
  { start: "2025-05-26", end: "2025-06-01", price: 0.26 },
];

const getCurrentPrice = () => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); // Normalize today's date to midnight UTC

  for (const range of priceTable) {
    const startDate = new Date(`${range.start}T00:00:00.000Z`);
    const endDate = new Date(`${range.end}T23:59:59.999Z`); // Include full last day

    if (today >= startDate && today <= endDate) {
      return range.price;
    }
  }

  return 0.32; // Default price
};


export const getGaraEstimate = (round: number, token: string, amount: number, tokenValue?: number) => {
  (round);
  if (!token || !amount) return 0;
  
  let price = getCurrentPrice();

  if (token === "USDC" || token === "USDT") {
    return amount / price;
  }

  if (!tokenValue) return 0;
  return amount * tokenValue;
};

export const usdcToGara = (usdc: number) => usdc / getCurrentPrice();


export const getChainByName = (chain: string): Chain => {
  switch (chain) {
    case "Polygon":
      return polygon
    case "Ethereum":
      return mainnet
    case "BNB Smart Chain":
      return bsc
    default:
      return polygon
  }
}

// The ABI of the ERC-20 contract (relevant parts for the `transfer` function)
const erc20Abi = [
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
]

const handleOpsAbi = parseAbi([
  "function handleOps((address,uint256,bytes,bytes,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],address)",
])

export function validateTransactionHash(txHash: string) {
  return /^(0x)?[0-9a-fA-F]{64}$/.test(txHash)
}

function toLowerCase(address: string) {
  if (!address || typeof address !== "string") return ""
  return address.toLowerCase()
}

export const ethereumRpcUrl =
  process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/dNMADuse_UiHTjTasg3_E2ezx8IpNcxF"
export const polygonRpcUrl =
  process.env.NEXT_PUBLIC_POLYGON_RPC_URL || "https://polygon-mainnet.g.alchemy.com/v2/dNMADuse_UiHTjTasg3_E2ezx8IpNcxF"
export const bscRpcUrl =
  process.env.NEXT_PUBLIC_BSC_RPC_URL || "https://bnb-mainnet.g.alchemy.com/v2/dNMADuse_UiHTjTasg3_E2ezx8IpNcxF"

export const getRpcNode = (chain: string) => {
  //monda
  switch (chain) {
    case "Ethereum":
      return http(ethereumRpcUrl)
    case "Polygon":
      return http(polygonRpcUrl)
    case "BNB Smart Chain":
      return http(bscRpcUrl)
    default:
      return http()
  }
}
// Helper function for retrying with a delay
const retryWithDelay = async (fn: () => Promise<any>, retries: number, delay: number) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i < retries - 1) {
        (`Retry ${i + 1}/${retries} failed, retrying in ${delay / 1000} seconds...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      } else {
        throw error // If all retries fail, throw the error
      }
    }
  }
}

export async function validateTransaction({
  chain,
  txHash,
  from,
  to,
  amount,
}: {
  chain: string
  txHash: HexAddress
  from: HexAddress
  to: HexAddress
  amount: string
}) {
  console.log({ chain, txHash, from, to, amount })
  try {
    if (!validateTransactionHash(txHash)) {
      throw new Error("Invalid transaction hash")
    }
    const _chain = getChainByName(chain)
    const transport = getRpcNode(chain)
    const publicClient = createPublicClient({
      chain: _chain,
      transport: transport,
    })

    let decoded
    let functionTo: HexAddress | null = null
    let functionFrom = "" as HexAddress
    let functionValue = "" as BigNumberish

    // Retry mechanism for getTransactionReceipt with a 5-second delay and 3 retries
    const receipt = await retryWithDelay(() => publicClient.getTransactionReceipt({ hash: txHash }), 3, 5000)
    console.log({ receipt })
    if (receipt?.from === from) functionFrom = receipt.from
    if (receipt?.to === to) functionTo = receipt.to

    const transaction = await publicClient.getTransaction({ hash: txHash })
    console.log({ transaction })
    if (!functionFrom) functionFrom = transaction?.from
    if (!functionTo) functionTo = transaction?.to
    if (!functionValue) functionValue = parseUnits(transaction.value.toString(), 0)

    if (!functionFrom || !functionTo || !functionValue) {
      try {
        decoded = decodeFunctionData({
          abi: erc20Abi,
          data: transaction.input,
        })
        console.log({ decoded })
        if (!functionFrom) functionFrom = transaction?.from
        if (!functionTo) functionTo = (decoded?.args?.[0] || "") as HexAddress
        if (!functionValue) functionValue = (decoded?.args?.[1] || "") as BigNumberish
      } catch (error) {
        decoded = decodeFunctionData({
          abi: handleOpsAbi,
          data: transaction.input,
        })
        console.log({ decoded })
        if (!functionFrom) functionFrom = (decoded?.args?.[0]?.[0]?.[0] || "") as HexAddress
        if (!functionTo) functionTo = transaction?.from
        if (!functionValue) functionValue = (parseUnits(transaction.v.toString(), 0) || "") as BigNumberish
      }
    }

    console.log("values after check")
    console.log({ functionFrom, functionTo, functionValue })

    let amountInWei
    if (chain === "Ethereum") {
      amountInWei = parseEther(amount.toString())
      // amountInWei = parseUnits(amount.toString(), 18)
    } else if (chain !== "BNB Smart Chain") {
      amountInWei = parseUnits(amount.toString(), 6)
    } else {
      amountInWei = parseUnits(amount.toString(), 18)
    }

    console.log({ amountInWei })

    if (receipt.status !== "success") {
      throw new Error("Invalid transaction status")
    }
    if (toLowerCase(functionFrom) !== toLowerCase(from)) {
      throw new Error("Invalid sender address")
    }
    if (toLowerCase(functionTo) !== toLowerCase(to)) {
      throw new Error("Invalid recipient address")
    }
    console.log({ functionValue, amountInWei })
    if (functionValue !== amountInWei) {
      throw new Error("Invalid amount")
    }

    return { success: true }
  } catch (error) {
    await sendMail({
      recipients: ["d.forejtek@gmail.com", "office@coingarage.io"],
      subject: `GARA Coin - Error in transaction validation`,
      content: JSON.stringify({ inputData: { chain, txHash, from, to, amount }, error }, undefined, 2),
    })
    console.error("Error:", error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatAmount = (amount: number = 0, fraction = 2) => {
  if (amount && typeof amount === "number") {
    if (amount > 1) {
      let value = +amount.toFixed(fraction)
      return value.toLocaleString("us", {
        minimumFractionDigits: fraction,
        maximumFractionDigits: fraction,
      })
    } else {
      let value = +amount.toFixed(4)
      return value.toLocaleString("us", {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      })
    }
  }
  return "0.00"
}

export const formatCurrency = (amount: number = 0, fraction = 2) => {
  if (amount && typeof amount === "number") {
    if (amount > 1) {
      return new Intl.NumberFormat("en", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: fraction,
        maximumFractionDigits: fraction,
      }).format(amount)
    } else if (amount > 0.0001) {
      return new Intl.NumberFormat("en", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      }).format(amount)
    } else {
      return new Intl.NumberFormat("en", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 6,
        maximumFractionDigits: 6,
      }).format(amount)
    }
  }
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(0)
}

export const formatPercentage = (amount: number = 0) => {
  if (amount && typeof amount === "number") {
    let value = Number(amount) / 100
    return new Intl.NumberFormat("en", {
      style: "percent",
      unit: "percent",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }
  return "0.00%"
}

export const timeAgo = (timestamp: Date, locale: string = "en") => {
  let value
  const diff = (new Date().getTime() - timestamp.getTime()) / 1000
  const minutes = Math.floor(diff / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(months / 12)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })

  if (years > 0) {
    value = rtf.format(0 - years, "year")
  } else if (months > 0) {
    value = rtf.format(0 - months, "month")
  } else if (days > 0) {
    value = rtf.format(0 - days, "day")
  } else if (hours > 0) {
    value = rtf.format(0 - hours, "hour")
  } else if (minutes > 0) {
    value = rtf.format(0 - minutes, "minute")
  } else {
    value = rtf.format(0 - diff, "second")
  }
  return value
}

export const formatBalance = (rawBalance: string) => {
  const balance = (parseInt(rawBalance) / 1000000000000000).toFixed(2)
  return balance
}

export const formatChainAsNum = (chainIdHex: string) => {
  const chainIdNum = parseInt(chainIdHex)
  return chainIdNum
}

export const formatAddress = (addr: string | undefined, length: number | undefined = 12) => {
  return `${addr?.substring(0, 5)}...${addr?.substring(addr.length - length)}`
}

export const formatDateString = (date: string) => {
  if (!date) return ""
  if (typeof window === "undefined") return new Date(date).toLocaleDateString("en-US")
  return new Date(date).toLocaleDateString()
}
