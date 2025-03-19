import { contractAddresses } from "../components/utils"
import { createPublicClient, http } from "viem"
import { getRpcNode, getChainByName } from "../utils/utils"

const erc20ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
]

export async function getTokenBalance({
  walletAddress,
  token,
  chainName,
}: {
  walletAddress: string
  token: string
  chainName: "Polygon" | "Ethereum" | "BNB Smart Chain"
}): Promise<{ balance: string; humanReadableBalance: number }> {
  const client = createPublicClient({
    chain: getChainByName(chainName),
    transport: getRpcNode(chainName),
  })
  console.log("token chainName", token, chainName)
  // @ts-ignore
  const tokenContractAddress = contractAddresses[token][chainName]

  const balance = (await client.readContract({
    address: tokenContractAddress,
    abi: erc20ABI,
    functionName: "balanceOf",
    args: [walletAddress],
  })) as string

  const decimals = chainName === "BNB Smart Chain" ? 18 : 6

  // The balance is returned in the token's smallest units (e.g., wei for ETH, smallest unit for ERC-20 tokens)
  const humanReadableBalance = Number(balance) / 10 ** decimals
  //
  return {
    balance,
    humanReadableBalance,
  }
}

// const walletAddress = "0x..." // User's wallet address
// const tokenContractAddress = "0x..." // ERC-20 token contract address

// getTokenBalance(walletAddress, tokenContractAddress).then((balance) => {
//   console.log(`Token balance: ${balance}`)
// })
