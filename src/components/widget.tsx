"use client"

import { useEffect, useState, useRef } from "react"
import { isAddress, parseUnits } from "viem"
// @ts-ignore
import { useAccount, useBalance, useSendTransaction, useWalletClient, useWriteContract } from "wagmi"
// @ts-ignore
import { useAddRecentTransaction, useChainModal } from "@rainbow-me/rainbowkit"
import { ConnectButton } from "./connect-button"
import { z } from "zod"
import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { BigNumber, ethers } from "ethers"
import { zodResolver } from "@hookform/resolvers/zod";
import debounce from "lodash.debounce";
import { supabase } from "../lib/supabase"

import { CoinInput } from "./coin-input"
import { Button } from "./ui/button"
import { cn, formatAmount, getGaraEstimate, usdcToGara } from "../utils/utils"
import { useForm, useWatch } from "react-hook-form"
import { useGaraStore } from "../lib/store/provider"
import TransactionStatusModal from "./transaction-status-modal"
import { sendPayment } from "../lib/send-payment"
import { CurrencySelect } from "./currency-select"
import { getTokenBalance } from "../lib/get-balance"
import CountdownTimer from "./countdown-timer"
import ProgressBar from 'modified-react-progress-bar.git/@ramonak/react-progress-bar'
import { useRouter } from "next/navigation";

import { useSwitchChain } from "wagmi"
import { mainnet, polygon, bsc } from "@wagmi/core/chains"
import { getChainByName } from "../utils/utils"
import { ReferralPopup } from "./popup-referal"
import { useSearchParams } from "next/navigation"
import axios from "axios"

const COINGARAGE_CONTRACT_ADDRESS = "0xb523aBD0732a3208670ffceaF61eAbf7672a7402" as `0x${string}`
const TOKENS_SOLD = 652163

const TOTAL_TOKEN_AMOUNT = 99000000
const endDate = 1740787199
const firstRoundEndDate = 1735689599
const secondRoundEndDate = 1738367999
const polygonRpcUrl = "https://polygon-mainnet.g.alchemy.com/v2/" + process.env.NEXT_PUBLIC_POLYGON_RPC_KEY
const ethRpcUrl = "https://eth-mainnet.g.alchemy.com/v2/" + process.env.NEXT_PUBLIC_ETH_RPC_KEY
const bscRpcUrl = "https://bnb-mainnet.g.alchemy.com/v2/" + process.env.NEXT_PUBLIC_BSC_RPC_KEY

const polygonProvider = new ethers.providers.JsonRpcProvider(polygonRpcUrl)
const ethProvider = new ethers.providers.JsonRpcProvider(ethRpcUrl)
const bscProvider = new ethers.providers.JsonRpcProvider(bscRpcUrl)

const contractAddress = "0xb523aBD0732a3208670ffceaF61eAbf7672a7402"

const ethAddress = "0x4b818386652f5Dd80406135d500BE404581e996e"
const polygonAddress = "0x2431e5F353daed3b6553E7C7A1FBebaBd8Db4b11"
const bscAddress = "0xb33263B7442c5bE789cA4bDF1988e20a1fb86e80"

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
  // Get today's date as a UTC string
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); // Normalize today to midnight UTC

  for (const range of priceTable) {
    // Parse start and end dates in UTC
    const startDate = new Date(`${range.start}T00:00:00.000Z`);
    const endDate = new Date(`${range.end}T23:59:59.999Z`); // Ensure the end date includes full day

    if (today >= startDate && today <= endDate) {
      return range.price;
    }
  }

  console.log("❌ No match found, returning default price.");
  return 0.32; // Default price if no range matches
};

console.log(getCurrentPrice()); // Debug test

const handleWalletConnect = () => {
  console.log("wallet connect triggered")
  // Trigger Google Analytics event
  if (typeof gtag === "function") {
    gtag("event", "wallet")
  }

  // Trigger Facebook Pixel event
  if (typeof fbq === "function") {
    fbq("track", "Lead")
  }
}

const ethVaultAbi = [
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: "uint8", name: "version", type: "uint8" }],
    name: "Initialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
      { indexed: true, internalType: "address", name: "newOwner", type: "address" },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "startSaleDate", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "endSaleDate", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "firstRoundEndDate", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "secondRoundEndDate", type: "uint256" },
    ],
    name: "SaleDatesUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: "uint256", name: "tokenBalance", type: "uint256" }],
    name: "TokenBalanceUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "buyer", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "value", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "chainId", type: "uint256" },
    ],
    name: "TokenPurchase",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "ethWithdrawBalance", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "usdtWithdrawBalance", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "usdcWithdrawBalance", type: "uint256" },
    ],
    name: "Withdrawl",
    type: "event",
  },
  {
    inputs: [],
    name: "TOKEN_PRICE_USD_FIRST_STAGE",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "TOKEN_PRICE_USD_SECONDE_STAGE",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "TOKEN_PRICE_USD_THIRD_STAGE",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "assist",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "enum ETHVault.PaymentMethod", name: "paymentMethod", type: "uint8" },
      { internalType: "uint256", name: "paymentAmount", type: "uint256" },
    ],
    name: "buyTokenEthPay",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "paymentAmount", type: "uint256" },
      { internalType: "enum ETHVault.PaymentMethod", name: "paymentMethod", type: "uint8" },
    ],
    name: "calculateTokenAmountPay",
    outputs: [{ internalType: "uint256", name: "buyTokenAmountPay", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "endSaleDate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "firstRoundEndDate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getChainId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "contract AggregatorV3Interface", name: "priceFeed", type: "address" }],
    name: "getLatestPrice",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getSaleDatesAndBalance",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  { inputs: [], name: "initialize", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  { inputs: [], name: "renounceOwnership", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [],
    name: "secondRoundEndDate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_assist", type: "address" }],
    name: "setAssist",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_usdt", type: "address" },
      { internalType: "address", name: "_usdc", type: "address" },
    ],
    name: "setStableCoin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "startSaleDate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token",
    outputs: [{ internalType: "contract IERC20Upgradeable", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "tokenBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_startSaleDate", type: "uint256" },
      { internalType: "uint256", name: "_endSaleDate", type: "uint256" },
      { internalType: "uint256", name: "_firstRoundEndDate", type: "uint256" },
      { internalType: "uint256", name: "_secondRoundEndDate", type: "uint256" },
    ],
    name: "updateSaleDates",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_tokenBalance", type: "uint256" }],
    name: "updateTokenBalance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "usdc",
    outputs: [{ internalType: "contract IERC20Upgradeable", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "usdt",
    outputs: [{ internalType: "contract IERC20Upgradeable", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  { inputs: [], name: "withdraw", outputs: [], stateMutability: "nonpayable", type: "function" },
]
const bscVaultAbi = [
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: "uint8", name: "version", type: "uint8" }],
    name: "Initialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
      { indexed: true, internalType: "address", name: "newOwner", type: "address" },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "startSaleDate", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "endSaleDate", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "firstRoundEndDate", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "secondRoundEndDate", type: "uint256" },
    ],
    name: "SaleDatesUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: "uint256", name: "tokenBalance", type: "uint256" }],
    name: "TokenBalanceUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "buyer", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "value", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "chainId", type: "uint256" },
    ],
    name: "TokenPurchase",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "bnbWithdrawBalance", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "usdtWithdrawBalance", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "usdcWithdrawBalance", type: "uint256" },
    ],
    name: "Withdrawl",
    type: "event",
  },
  {
    inputs: [],
    name: "TOKEN_PRICE_USD_FIRST_STAGE",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "TOKEN_PRICE_USD_SECONDE_STAGE",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "TOKEN_PRICE_USD_THIRD_STAGE",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "assist",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "enum BNBVault.PaymentMethod", name: "paymentMethod", type: "uint8" },
      { internalType: "uint256", name: "paymentAmount", type: "uint256" },
    ],
    name: "buyTokenBnbPay",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "paymentAmount", type: "uint256" },
      { internalType: "enum BNBVault.PaymentMethod", name: "paymentMethod", type: "uint8" },
    ],
    name: "calculateTokenAmountPay",
    outputs: [{ internalType: "uint256", name: "buyTokenAmountPay", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "endSaleDate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "firstRoundEndDate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getChainId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "contract AggregatorV3Interface", name: "priceFeed", type: "address" }],
    name: "getLatestPrice",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getSaleDatesAndBalance",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  { inputs: [], name: "initialize", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  { inputs: [], name: "renounceOwnership", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [],
    name: "secondRoundEndDate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_assist", type: "address" }],
    name: "setAssist",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_usdt", type: "address" },
      { internalType: "address", name: "_usdc", type: "address" },
    ],
    name: "setStableCoin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "startSaleDate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token",
    outputs: [{ internalType: "contract IERC20Upgradeable", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "tokenBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_startSaleDate", type: "uint256" },
      { internalType: "uint256", name: "_endSaleDate", type: "uint256" },
      { internalType: "uint256", name: "_firstRoundEndDate", type: "uint256" },
      { internalType: "uint256", name: "_secondRoundEndDate", type: "uint256" },
    ],
    name: "updateSaleDates",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_tokenBalance", type: "uint256" }],
    name: "updateTokenBalance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "usdc",
    outputs: [{ internalType: "contract IERC20Upgradeable", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "usdt",
    outputs: [{ internalType: "contract IERC20Upgradeable", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  { inputs: [], name: "withdraw", outputs: [], stateMutability: "nonpayable", type: "function" },
]
const polVaultAbi = [
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: "uint8", name: "version", type: "uint8" }],
    name: "Initialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
      { indexed: true, internalType: "address", name: "newOwner", type: "address" },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "startSaleDate", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "endSaleDate", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "firstRoundEndDate", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "secondRoundEndDate", type: "uint256" },
    ],
    name: "SaleDatesUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: "uint256", name: "tokenBalance", type: "uint256" }],
    name: "TokenBalanceUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "buyer", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "value", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "chainId", type: "uint256" },
    ],
    name: "TokenPurchase",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "polWithdrawBalance", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "usdtWithdrawBalance", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "usdcWithdrawBalance", type: "uint256" },
    ],
    name: "Withdrawl",
    type: "event",
  },
  {
    inputs: [],
    name: "TOKEN_PRICE_USD_FIRST_STAGE",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "TOKEN_PRICE_USD_SECONDE_STAGE",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "TOKEN_PRICE_USD_THIRD_STAGE",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "assist",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "enum POLVault.PaymentMethod", name: "paymentMethod", type: "uint8" },
      { internalType: "uint256", name: "paymentAmount", type: "uint256" },
    ],
    name: "buyTokenPolPay",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "paymentAmount", type: "uint256" },
      { internalType: "enum POLVault.PaymentMethod", name: "paymentMethod", type: "uint8" },
    ],
    name: "calculateTokenAmountPay",
    outputs: [{ internalType: "uint256", name: "buyTokenAmountPay", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "endSaleDate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "firstRoundEndDate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getChainId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "contract AggregatorV3Interface", name: "priceFeed", type: "address" }],
    name: "getLatestPrice",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getSaleDatesAndBalance",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  { inputs: [], name: "initialize", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  { inputs: [], name: "renounceOwnership", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [],
    name: "secondRoundEndDate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_assist", type: "address" }],
    name: "setAssist",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_usdt", type: "address" },
      { internalType: "address", name: "_usdc", type: "address" },
    ],
    name: "setStableCoin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "startSaleDate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token",
    outputs: [{ internalType: "contract IERC20Upgradeable", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "tokenBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_startSaleDate", type: "uint256" },
      { internalType: "uint256", name: "_endSaleDate", type: "uint256" },
      { internalType: "uint256", name: "_firstRoundEndDate", type: "uint256" },
      { internalType: "uint256", name: "_secondRoundEndDate", type: "uint256" },
    ],
    name: "updateSaleDates",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_tokenBalance", type: "uint256" }],
    name: "updateTokenBalance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "usdc",
    outputs: [{ internalType: "contract IERC20Upgradeable", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "usdt",
    outputs: [{ internalType: "contract IERC20Upgradeable", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  { inputs: [], name: "withdraw", outputs: [], stateMutability: "nonpayable", type: "function" },
]
const contractAbi = [
  {
    inputs: [
      { internalType: "address", name: "_tokenAddress", type: "address" },
      { internalType: "uint256", name: "_startSaleDate", type: "uint256" },
      { internalType: "uint256", name: "_endSaleDate", type: "uint256" },
      { internalType: "uint256", name: "_firstRoundEndDate", type: "uint256" },
      { internalType: "uint256", name: "_secondRoundEndDate", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "startSaleDate", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "endSaleDate", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "firstRoundEndDate", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "secondRoundEndDate", type: "uint256" },
    ],
    name: "SaleDateUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: "uint256", name: "newBalance", type: "uint256" }],
    name: "TokenBalanceUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "buyer", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "TokensSoldUpdated",
    type: "event",
  },
  {
    inputs: [],
    name: "assist",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "endSaleDate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "firstRoundEndDate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getEndSaleDate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getStartSaleDate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTokenBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getfirstRoundEndDate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getsecondRoundEndDate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "buyer", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "handleTokenPurchase",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "secondRoundEndDate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_assist", type: "address" }],
    name: "setAssist",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_newOwner", type: "address" }],
    name: "setOwner",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_startSaleDate", type: "uint256" },
      { internalType: "uint256", name: "_endSaleDate", type: "uint256" },
      { internalType: "uint256", name: "_firstRoundEndDate", type: "uint256" },
      { internalType: "uint256", name: "_secondRoundEndDate", type: "uint256" },
    ],
    name: "setSaleDate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_token", type: "address" }],
    name: "setToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "startSaleDate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token",
    outputs: [{ internalType: "contract IERC20", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "tokensSoldPerUser",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "vaultContractAddress",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract IERC20", name: "_token", type: "address" },
      { internalType: "address", name: "to", type: "address" },
    ],
    name: "withdrawToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
]

const formSchema = z.object({
  to: z.string().refine((value) => isAddress(value), { message: "Invalid Address" }),
  from: z.string().refine((value) => isAddress(value), { message: "Invalid Address" }),
  garaEstimate: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "GARA amount must be a positive number",
  }),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Amount must be a positive number",
  }),
  token: z.string(),
});

const calculateRound = () => {
  const currentTime = new Date().getTime()
  if (firstRoundEndDate * 1000 > Number(currentTime)) {
    return 1
  } else if (secondRoundEndDate * 1000 > Number(currentTime)) {
    return 2
  } else if (endDate * 1000 > Number(currentTime)) {
    return 3
  }
}

const BACKEND_ENDPOINT = process.env.NEXT_PUBLIC_BACKEND_ENDPOINT

export function BuyGara({ 
  className, 
  hideHeader = false, 
  onTransactionSuccess = null, 
  thankYouRedirectPath = "/en/thank-you", 
  storeDataKey = "gara-transaction-data" 
}: {
  className?: string; 
  hideHeader?: boolean;
  onTransactionSuccess?: ((data: any) => void) | null;
  thankYouRedirectPath?: string | null;
  storeDataKey?: string;
}) {
  const [currentNetworkId, setCurrentNetworkId] = useState(1);
  const [hasFetchedOnLoad, setHasFetchedOnLoad] = useState(false);
  const [activeButton, setActiveButton] = useState("ethereum");
  const { switchChainAsync } = useSwitchChain();
  const [showPopup, setShowPopup] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [activeInput, setActiveInput] = useState<"source" | "gara">("source"); // Track which input is active
  const [isEditing, setIsEditing] = useState(false);
  const [showMinimumError, setShowMinimumError] = useState(false);
  const [errorMessageTimeout, setErrorMessageTimeout] = useState<NodeJS.Timeout | null>(null);
  const [currentTokenBalance, setCurrentTokenBalance] = useState("0");

  const searchParams = useSearchParams()
  const { address, chain } = useAccount()

  useEffect(() => {
    const setReferred = async(walletAddress: string, referred: string) => {
      try {
        // Check if user already has a referral code assigned
        const userResponse = await axios.get(`${BACKEND_ENDPOINT}/user/getUser`, {
          params: { walletAddress }
        });
        
        // If user data exists and has the same referral code as what's being attempted
        if (userResponse.data && userResponse.data.referral === referred) {
          console.log("Self-referral attempted and prevented");
          return;
        }
        
        // Otherwise, proceed with setting the referral
        const result = await axios.post(`${BACKEND_ENDPOINT}/user/setReferred`, {
          walletAddress, 
          referred
        });
      } catch (error) {
        console.error("Error processing referral:", error);
      }
    }
  
    const referred = searchParams.get('ref')
    if (referred && address) {
      setReferred(address, referred)
    }
  }, [searchParams, address])  

  // Create a conversion function
  const convertUsdToSelectedCurrency = (usdAmount) => {
    console.log('convertUsdToSelectedCurrency');
    if (!token || !nativeUSD) return usdAmount.toString();
    
    // For stablecoins, keep as USD with 3 decimal places
    if (token === "USDT" || token === "USDC") {
      return parseFloat(usdAmount).toFixed(5);
    }
    
    // For native tokens (ETH, POL, BNB), convert from USD and limit to 3 decimals
    const convertedAmount = usdAmount / (nativeUSD / 10);
    return convertedAmount.toFixed(5);
  };

  // Function to show error message for a few seconds
  const showErrorTemporarily = (shouldShow: boolean) => {
    console.log("Setting error message visibility:", shouldShow);
    
    // Clear any existing timeout
    if (errorMessageTimeout) {
      clearTimeout(errorMessageTimeout);
    }
    
    // Show or hide the error
    setShowMinimumError(shouldShow);
    
    // Set a timeout to hide the error after a while if it's showing
    if (shouldShow) {
      const timeout = setTimeout(() => {
        setShowMinimumError(false);
      }, 5000);
      
      setErrorMessageTimeout(timeout);
    }
  };

  const [inputUsdValue, setInputUsdValue] = useState(20); // Default to $20
  //@ts-ignore
  async function changeChain(chains) {
    console.log('changeChain');
    try {
      const _chain = getChainByName(chains)
      //@ts-ignore
      const switchedChain = await switchChainAsync({ chainId: _chain.id })
      //@ts-ignore
      console.log("Switched to chain:", switchedChain.id)
      setCurrentNetworkId(switchedChain.id)
      // console.log('Switched to chain:', chain&&chain?.id);
    } catch (error) {
      //@ts-ignore
      console.error("Failed to switch chain:", error.message)
    }
  }
  //L: Here implement the functions
  //L: After wallet connect this entire logic and the 3 frontend buttons can be hidden so it won't confuse users (once wallet is connected only way to switch networks is the current way thru the connect button)
  const switchToEthereum = async () => {
    console.log("Switching to Ethereum")
    await changeChain("Ethereum")
    //L: Switch the network to etheruem (the default state)
    //L: Currency select will have USDT, USDC and ETH currencies
    //L: Please fix the minimum amount check to work here as well (before the wallet connect)
  }

  const switchToPolygon = async () => {
    console.log("Switching to Polygon", polygon.id)
    await changeChain("Polygon")
    //L: Switch the network to polygon
    //L: Currency select will have USDT, USDC and POL currencies
  }

  const switchToBSC = async () => {
    console.log("Switching to Binance Smart Chain")
    await changeChain("BNB Smart Chain")
    //L: Switch the network to polygon
    //L: Currency select will have USDT, USDC and BSC currencies
  }

  const handleNetworkSwitch = (network) => {
    console.log('handleNetworkSwitch');
    setActiveButton(network)
    
    // Set converting flag before network change
    setIsConverting(true);
    
    switch (network) {
      case "ethereum":
        switchToEthereum()
        break
      case "polygon":
        switchToPolygon()
        break
      case "bsc":
        switchToBSC()
        break
      default:
        console.error("Unknown network:", network)
    }
  }

  /**
   * Ensures input values never go below minimum USD threshold
   * @param value The current input value
   * @param token The selected token
   * @param nativeUSD The USD conversion rate for native tokens
   * @param minUsdValue The minimum USD value (default 20)
   * @returns The corrected value ensuring minimum threshold
   */
  const enforceMinimumValue = (
    value: string | number, 
    token: string, 
    nativeUSD: number,
    minUsdValue: number = 20
  ): { result: string, wasEnforced: boolean } => {
    console.log('enforceMinimumValue');
    // Convert value to number
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Skip for invalid inputs
    if (isNaN(numValue)) return { 
      result: typeof value === 'string' ? value : value.toString(),
      wasEnforced: false 
    };
    
    // Calculate USD equivalent
    const usdEquivalent = token === "USDT" || token === "USDC" 
      ? numValue 
      : numValue * (nativeUSD / 10);
      
    // Calculate the minimum token value
    const minTokenValue = token === "USDT" || token === "USDC" 
      ? minUsdValue 
      : minUsdValue / (nativeUSD / 10);
      
    // Log for debugging
    console.log(`Current value: ${numValue} ${token}`);
    console.log(`USD equivalent: $${usdEquivalent}`);
    console.log(`Minimum required: ${minTokenValue.toFixed(5)} ${token}`);
    console.log(`Below minimum: ${usdEquivalent < minUsdValue}`);
      
    // If above minimum, return as is
    if (usdEquivalent >= minUsdValue) {
      return { 
        result: typeof value === 'string' ? value : value.toFixed(5),
        wasEnforced: false
      };
    }
    
    // Otherwise, enforce the minimum value
    return { 
      result: minTokenValue.toFixed(5),
      wasEnforced: true
    };
  };

  /**
   * Ensures GARA estimate never goes below minimum based on current price
   * @param value The current GARA value
   * @param currentPrice The current GARA price in USD
   * @param minUsdValue The minimum USD value (default 20)
   * @returns The corrected GARA value ensuring minimum threshold
   */
  const enforceMinimumGara = (
    value: string | number,
    currentPrice: number,
    minUsdValue: number = 20
  ): string => {
    console.log('enforceMinimumGara');
    // Convert value to number
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Skip for invalid inputs
    if (isNaN(numValue)) return typeof value === 'string' ? value : value.toString();
    
    // Calculate USD equivalent
    const usdEquivalent = numValue * currentPrice;
    
    // If above minimum, return as is
    if (usdEquivalent >= minUsdValue) {
      return typeof value === 'string' ? value : value.toFixed(5);
    }
    
    // Otherwise, calculate and return minimum GARA value
    const minGaraValue = minUsdValue / currentPrice;
    return minGaraValue.toFixed(5);
  };

  const t = useTranslations("GARA.main.buyGARA")
  const [tokenSold, setTokenSold] = useState(0)
  const [nativeUSD, setNativeUSD] = useState(0)
  const sepoliaContract = new ethers.Contract(ethAddress, ethVaultAbi, ethProvider)
  const bscContract = new ethers.Contract(bscAddress, bscVaultAbi, bscProvider)
  const polygonContract = new ethers.Contract(polygonAddress, polVaultAbi, polygonProvider)

  const form = useForm<z.infer<typeof formSchema>>({
    mode: "onSubmit",
    resolver: zodResolver(formSchema),
    defaultValues: {
      garaEstimate: usdcToGara(20).toString(), // Changed default to match $20
      amount: "20.000",
      to: COINGARAGE_CONTRACT_ADDRESS,
      from: address,
    },
  });

  useEffect(() => {
    async function fetchTokenSales() {
      console.log('fetchTokenSales');
      try {
        const { data, error } = await supabase
          .from('token_sales')
          .select('token_sold')
          .eq('id', 1)
          .single()
  
        if (error) {
          console.error("Error fetching token sales:", error)
          return
        }
  
        if (data) {
          setTokenSold(data.token_sold)
        }
      } catch (error) {
        console.error("Unexpected error fetching token sales:", error)
      }
    }
  
    fetchTokenSales()
  
    // Fetch every 15 seconds to keep the UI updated
    const interval = setInterval(() => {
      fetchTokenSales()
    }, 15000)
  
    return () => clearInterval(interval)
  }, [])
  
  const {
    transactionStatus,
    setTransactionStatus,
    setOutcomingTransaction,
    setIncomingTransaction,
    reset: resetState,
  } = useGaraStore((state) => state)

  useEffect(() => {
    if (chain?.id === 1) {
      setActiveButton("ethereum")
    } else if (chain?.id === 137) {
      setActiveButton("polygon")
    } else if (chain?.id === 56) {
      setActiveButton("bsc")
    }
  }, [chain?.id])
  useEffect(() => {
    // Trigger analytics when a wallet is connected
    console.log("wallet connected")

    if (address) {
      handleWalletConnect()
    }
  }, [address])

  useEffect(() => {
    const fetchPrice = async () => {
      console.log('fetchPrice');
      // Default to Ethereum chain if no chain is connected
      const currentChainId = chain?.id || currentNetworkId

      if (currentChainId === 1) {
        // ETH
        const tokenBalance = await sepoliaContract.calculateTokenAmountPay(parseUnits("1", 18), 0)
        console.log("ETH: " + ethers.utils.formatUnits(tokenBalance.toString(), 6))
        setNativeUSD(Number(ethers.utils.formatUnits(tokenBalance.toString(), 6)))
      } else if (currentChainId === 56) {
        // BNB
        const tokenBalance = await bscContract.calculateTokenAmountPay(parseUnits("1", 18), 0)
        console.log("BNB: " + ethers.utils.formatUnits(tokenBalance.toString(), 6))
        setNativeUSD(Number(ethers.utils.formatUnits(tokenBalance.toString(), 6)))
      } else {
        // POL
        const tokenBalance = await polygonContract.calculateTokenAmountPay(parseUnits("1", 18), 0)
        console.log("POL: " + ethers.utils.formatUnits(tokenBalance.toString(), 6))
        setNativeUSD(Number(ethers.utils.formatUnits(tokenBalance.toString(), 6)))
      }
    }

    // Run once on load with default chain
    if (!hasFetchedOnLoad) {
      fetchPrice()
      setHasFetchedOnLoad(true)
    }

    // Run normally when dependencies change
    if (chain || currentNetworkId) {
      fetchPrice()
    }
  }, [chain, hasFetchedOnLoad, currentNetworkId])

  // const eth_usd = data?.ethereum?.usd

  const [open, setOpen] = useState(false)
  const [hasUnsufficientBalance, setHasUnsufficientBalance] = useState(false)
  const [hasLowerInputBalance, setHasLowerInputBalance] = useState(false)
  const [isCalculatingMinBalance, setIsCalculatingMinBalance] = useState(false)
  const toggleOpen = () => setOpen(!open)
  const handleOnOpenChange = () => {
    setOpen(!open)
    resetState()
  }

  const { data: balance } = useBalance({ address })
  const { data: walletClient } = useWalletClient()
  const addRecentTransaction = useAddRecentTransaction()
  const { writeContract } = useWriteContract()
  const { openChainModal } = useChainModal()
  const chainTxUrl = `${chain?.blockExplorers?.default?.url}/tx/`

  const { register, control, handleSubmit, setValue, watch, reset, formState: { errors } } = form;

  const amount = useWatch({ control: form.control, name: "amount" });
  const garaEstimate = useWatch({ control: form.control, name: "garaEstimate" });
  const token = useWatch({ control: form.control, name: "token" });

  const calculateGaraFromSource = (sourceAmount: string) => {
    console.log('calculateGaraFromSource');
    const round = calculateRound();
    const amountNum = parseFloat(sourceAmount);
    if (isNaN(amountNum) || amountNum < 0) return "0.000"; // Return a safe default for invalid inputs
    const garaEstimate = getGaraEstimate(
      round,
      token,
      amountNum,
      !["USDT", "USDC"].includes(token) ? nativeUSD : undefined
    );
    return garaEstimate.toFixed(5);
  };
  
  const calculateSourceFromGara = (garaAmount: string) => {
    console.log('calculateSourceFromGara');
    const garaNum = parseFloat(garaAmount);
    if (isNaN(garaNum) || garaNum < 0) return "0.000"; // Return a safe default for invalid inputs
    const currentPrice = getCurrentPrice();
    let sourceAmount = garaNum * currentPrice;
    if (token && !["USDT", "USDC"].includes(token) && nativeUSD) {
      sourceAmount = sourceAmount / (nativeUSD / 10);
    }
    return sourceAmount.toFixed(5);
  };

  const [minBalance, setMinBalance] = useState(10)
  const [minTokenBalance, setMinTokenBalance] = useState(0)

  useEffect(() => {
    if (!address || !token || !chain || !nativeUSD) return;
  
    const calculateMinTokenBalance = async () => {
      setIsCalculatingMinBalance(true);
  
      // Calculate minBalance based on chain
      const newMinBalance = chain?.name === "Ethereum" ? 20 : 20;
      setMinBalance(newMinBalance);
  
      // Calculate minTokenBalance based on token
      const newMinTokenBalance =
        token === "USDC" || token === "USDT"
          ? newMinBalance
          : newMinBalance / (nativeUSD / 10);
      setMinTokenBalance(newMinTokenBalance);
  
      setIsCalculatingMinBalance(false);
  
      // Check if the amount is sufficient AFTER minTokenBalance is updated
      if (Number(amount) < newMinTokenBalance) {
        form.setError("amount", {
          message: `Amount must be greater than $${newMinTokenBalance}`,
        });
        setHasLowerInputBalance(true);
      } else {
        form.clearErrors("amount");
        setHasLowerInputBalance(false);
      }
    };
  
    calculateMinTokenBalance();
  
    // Check token balance (ETH, POL, BNB)
    if (token === "ETH" || token === "POL" || token === "BNB") {
      // Save the current native token balance
      if (balance?.formatted) {
        setCurrentTokenBalance(balance.formatted);
      }
      
      const isInsufficientBalance = Number(balance?.formatted) < Number(amount);
      if (isInsufficientBalance) {
        form.setError("amount", { message: "Insufficient balance" });
      } else {
        form.clearErrors("amount");
      }
      setHasUnsufficientBalance(isInsufficientBalance);
    } else {
      // Fetch token balance for other tokens
      const fetchBalance = async () => {
        try {
          const balance = await getTokenBalance({
            walletAddress: address,
            token: token,
            chainName: chain?.name,
          });
          
          // Save the current token balance
          if (balance?.humanReadableBalance !== undefined) {
            setCurrentTokenBalance(balance.humanReadableBalance.toString());
          }
          
          const isInsufficientBalance = balance?.humanReadableBalance < Number(amount);
          if (isInsufficientBalance) {
            form.setError("amount", { message: "Insufficient balance" });
          } else {
            form.clearErrors("amount");
          }
          setHasUnsufficientBalance(isInsufficientBalance);
        } catch (error) {
          console.error(error);
        }
      };
  
      fetchBalance();
    }
  }, [amount, address, balance, token, chain, nativeUSD])

  useEffect(() => {
    setValue("from", address as `0x${string}`)
  }, [address, form])

  useEffect(() => {
    if (token === "ETH" && chain?.name !== "Ethereum") {
      if (typeof openChainModal === "function") {
        openChainModal()
      }
    }
  }, [token, chain, openChainModal])

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log('onSubmit');
    const { amount, token } = data
    console.log("onSubmit amount, token", amount, token, chain?.id)

    const to = COINGARAGE_CONTRACT_ADDRESS
    if (!address || !walletClient) {
      setTransactionStatus({ process: "sendPayment", status: "walletError" })
      return
      // handle state
    }
    handleOnOpenChange()
    setTransactionStatus({ process: "sendPayment", status: "submitting" })
    console.log("sendPayment call")
    console.log({
      token,
      chain,
      amount: amount,
      recipientAddress: to,
      senderAddress: address,
      walletClient,
    })
    const response = await sendPayment({
      token,
      chain,
      amount: amount,
      recipientAddress: to,
      senderAddress: address,
      walletClient,
      setTransactionStatus,
      setOutcomingTransaction,
      setIncomingTransaction,
      resetState,
      writeContract,
      sendTransaction,
    })
    if (!response?.txHash) {
      setTransactionStatus({
        process: "sendPayment",
        status: "transactionError",
      })
      return
    }
    addRecentTransaction({
      hash: response.txHash,
      description: "Exchange USDC to GARA",
    })

    setTransactionStatus({ process: "receivePayment", status: "pending" })

    // Successful deposit: Trigger purchase event
    const depositValue = parseFloat(amount) // Don't use toFixed() here

    console.log("buy button triggered")
    
    let usdValue = depositValue // Default to USD value if already in USD
    
    // Check if the currency is not USD (e.g., ETH, BNB, etc.)
    if (token === "ETH" || token === "BNB" || token === "POL") {
      try {
        // Assuming `nativeUSD` is the value of 1 ETH/BNB/POL in USD
        const currentRate = nativeUSD // Use your `nativeUSD` calculation from earlier
    
        if (currentRate) {
          usdValue = depositValue * currentRate * 0.1 // Convert to USD
        } else {
          console.warn("Exchange rate not available, defaulting to deposit value")
        }
      } catch (error) {
        console.error("Error calculating USD value:", error)
      }
    }

    // Google Analytics
    if (typeof gtag === "function") {
      gtag("event", "purchase", {
        value: usdValue.toFixed(2), // Ensure a consistent format
        currency: "USD",
      })
    }

    // Facebook Pixel
    if (typeof fbq === "function") {
      fbq("track", "Purchase", { value: usdValue.toFixed(2), currency: "USD" })
    }

    // const garaTransactionResponse = await fetch("/api/gara/exchange", {
    //   method: "POST",
    //   body: JSON.stringify({
    //     txHash: response.txHash,
    //     from: address,
    //     to: to,
    //     amount,
    //     chain: chain?.name,
    //     token,
    //   }),
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    // })
    // const responseData = await garaTransactionResponse.json()
    // console.log("GARA Transaction Response:", responseData)
    // if (!garaTransactionResponse.ok) {
    //   setTransactionStatus({
    //     process: "receivePayment",
    //     status: "transactionError",
    //   })
    //   setIncomingTransaction({ done: true, error: responseData.message })
    //   return
    // }
    addRecentTransaction({
      hash: response?.txHash,
      description: "Incoming GARA",
    })
    setIncomingTransaction({
      done: true,
      txHash: response?.txHash,
      // receipt: responseData?.status,
    })
    setTransactionStatus({ process: "receivePayment", status: "paymentSent" })
    reset()
  }
  
  // Add these state variables to track cursor position
  const [sourceInputCursor, setSourceInputCursor] = useState(null);
  const [garaInputCursor, setGaraInputCursor] = useState(null);
  const isCalculatingRef = useRef(false);

  // Update the input handlers to set the input values and mark that we're editing
  const handleSourceAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleSourceAmountChange');
    
    if (isConverting || isCalculatingRef.current) return;
    
    // Get input value and save cursor position
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    // Update the form value
    setValue("amount", value, { shouldValidate: false });
    setActiveInput("source");
    
    // Save cursor position for restoration
    setSourceInputCursor(cursorPosition);
  };
  
  const handleGaraAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleGaraAmountChange');
    
    if (isConverting || isCalculatingRef.current) return;
    
    // Get input value and save cursor position
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    // Update the form value
    setValue("garaEstimate", value, { shouldValidate: false });
    setActiveInput("gara");
    
    // Save cursor position for restoration
    setGaraInputCursor(cursorPosition);
  };

  // Add handlers for when users complete editing (blur events)
  const handleSourceAmountBlur = () => {
    console.log('handleSourceAmountBlur');
    setIsEditing(false);
    console.log("Source blur - checking minimum value");
    
    // Now apply minimum value enforcement
    if (amount && token && nativeUSD) {
      const parsedAmount = parseFloat(amount);
      
      // Calculate the minimum token value directly
      const minTokenValue = token === "USDT" || token === "USDC" 
        ? 20 // $20 minimum for stablecoins
        : 20 / (nativeUSD / 10); // Convert for non-stablecoins
      
      console.log(`Current amount: ${parsedAmount} ${token}`);
      console.log(`Minimum required: ${minTokenValue.toFixed(5)} ${token}`);
      console.log(`Below minimum: ${parsedAmount < minTokenValue}`);
      
      // Check if below minimum before enforcing
      const isBelowMinimum = parsedAmount < minTokenValue;
      
      // Apply enforcement (replace input with minimum value if too low)
      if (isBelowMinimum) {
        console.log(`Enforcing minimum value: ${minTokenValue.toFixed(5)} ${token}`);
        setValue("amount", minTokenValue.toFixed(5), { shouldValidate: true });
        
        // Calculate GARA based on the enforced amount
        const newGaraEstimate = calculateGaraFromSource(minTokenValue.toFixed(5));
        setValue("garaEstimate", newGaraEstimate);
      }
      
      // Show error message if minimum was enforced
      showErrorTemporarily(isBelowMinimum);
      
      // Set the minimum token balance for reference in the error message
      setMinTokenBalance(minTokenValue);
    }
  };
  
  const handleGaraAmountBlur = () => {
    console.log('handleGaraAmountBlur');
    setIsEditing(false);
    console.log("GARA blur - checking minimum value");
    
    // Now apply minimum value enforcement
    if (garaEstimate && token && nativeUSD) {
      const parsedGara = parseFloat(garaEstimate);
      const price = getCurrentPrice();
      
      // Calculate the USD value of the GARA amount
      const usdValue = parsedGara * price;
      
      // Calculate the minimum GARA value
      const minGaraValue = 20 / price; // $20 divided by GARA price
      
      console.log(`Current GARA: ${parsedGara}`);
      console.log(`USD value: $${usdValue.toFixed(2)}`);
      console.log(`Minimum GARA required: ${minGaraValue.toFixed(5)}`);
      console.log(`Below minimum: ${usdValue < 20}`);
      
      // Check if below minimum before enforcing
      const isBelowMinimum = usdValue < 20;
      
      // Apply enforcement (replace input with minimum value if too low)
      if (isBelowMinimum) {
        console.log(`Enforcing minimum GARA: ${minGaraValue.toFixed(5)}`);
        setValue("garaEstimate", minGaraValue.toFixed(5), { shouldValidate: true });
        
        // Calculate amount based on the enforced GARA
        const newAmount = calculateSourceFromGara(minGaraValue.toFixed(5));
        setValue("amount", newAmount);
        
        // Calculate the minimum token balance for the error message
        const minTokenValue = token === "USDT" || token === "USDC" 
          ? 20 
          : 20 / (nativeUSD / 10);
        
        // Set the minimum token balance for reference in the error message
        setMinTokenBalance(minTokenValue);
      }
      
      // Show error message if minimum was enforced
      showErrorTemporarily(isBelowMinimum);
    }
  };

  useEffect(() => {
    return () => {
      if (errorMessageTimeout) {
        clearTimeout(errorMessageTimeout);
      }
    };
  }, [errorMessageTimeout]);

  // Add useEffects to restore cursor position after render
  useEffect(() => {
    if (sourceInputCursor !== null) {
      // Find the input element
      const inputElement = document.querySelector('input[name="amount"]');
      if (inputElement) {
        // Restore cursor position
        (inputElement as HTMLInputElement).setSelectionRange(sourceInputCursor, sourceInputCursor);
      }
      // Reset the saved position
      setSourceInputCursor(null);
    }
  }, [amount, sourceInputCursor]);

  useEffect(() => {
    if (garaInputCursor !== null) {
      // Find the input element
      const inputElement = document.querySelector('input[name="garaEstimate"]');
      if (inputElement) {
        // Restore cursor position
        (inputElement as HTMLInputElement).setSelectionRange(sourceInputCursor, sourceInputCursor);
      }
      // Reset the saved position
      setGaraInputCursor(null);
    }
  }, [garaEstimate, garaInputCursor]);

  useEffect(() => {
    const progressBarFillers = document.querySelectorAll("#progress-bar-filler");

    if (progressBarFillers.length > 0) {
      progressBarFillers.forEach((progressBarFiller) => {
        (progressBarFiller as HTMLElement).style.position = "relative";

        const arrowContainer = document.createElement("div");
        arrowContainer.className = "absolute inset-0 flex items-center justify-start pointer-events-none arrow ml-40 lg:ml-48";

        for (let i = 0; i < 3; i++) {
          const arrow = document.createElement("span");
          arrow.className =
            "block w-[25px] h-[25px] border-b-[5px] border-r-[5px] border-white transform rotate-45 ml-10"; // Adjusted border width
          if (i === 1) arrow.style.animationDelay = "-0.2s";
          if (i === 2) arrow.style.animationDelay = "-0.4s";
          arrowContainer.appendChild(arrow);
        }

        progressBarFiller.appendChild(arrowContainer);
      });

      const style = document.createElement("style");
      style.textContent = `
        @keyframes animate {
          0% {
            opacity: 0;
            transform: rotate(315deg) translate(-10px, -10px);
          }
          50% {
            opacity: 0.3;
          }
          100% {
            opacity: 0;
            transform: rotate(315deg) translate(10px, 10px);
          }
        }
  
        .arrow span {
          animation: animate 2s infinite;
          margin: -10px;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const setAmountValue = (value: string) => {
    console.log('setAmountvalue');
    // Parse the value as a number first
    const numValue = parseFloat(value);
    
    // Format to 5 decimal places maximum and convert back to string
    const formattedValue = numValue.toFixed(5);
    
    // Set the formatted value
    form.setValue("amount", formattedValue);
  }

  const getRefferalLink = () => {
    console.log("Referral link requested");
    setShowPopup(true)
    //L: Your implemetation logic here
  };

  const currentPrice = getCurrentPrice();

  // Effect to handle bidirectional updates
  useEffect(() => {
    console.log('Bidirectional input useEffect')
    // Add a flag variable to track if an update is in progress
    let isUpdateInProgress = false;
    
    // First, check all conditions that would prevent updates
    if (isEditing || isConverting || !token || !nativeUSD) {
      return;
    }
    
    const updateFields = debounce(() => {
      // Set the flag to prevent re-entry
      if (isUpdateInProgress) return;
      isUpdateInProgress = true;
      
      try {
        // Get current price
        const price = getCurrentPrice();
        
        if (activeInput === "source" && amount) {
          console.log("Bidirectional update - source to GARA");
          // Calculate GARA based on the current amount
          const newGaraEstimate = calculateGaraFromSource(amount);
          
          // Only update if value actually changed
          if (newGaraEstimate !== garaEstimate) {
            setValue("garaEstimate", newGaraEstimate, { 
              shouldValidate: false, 
              shouldDirty: false,
              shouldTouch: false
            });
          }
          
          // Update USD value for reference
          const parsedAmount = parseFloat(amount);
          if (!isNaN(parsedAmount)) {
            const newUsdValue = token === "USDT" || token === "USDC"
              ? parsedAmount
              : parsedAmount * (nativeUSD / 10);
              
            setInputUsdValue(newUsdValue);
            
            // Check if below minimum, but don't enforce yet
            setHasLowerInputBalance(parsedAmount < minTokenBalance);
          }
          
        } else if (activeInput === "gara" && garaEstimate) {
          console.log("Bidirectional update - GARA to source");
          // Calculate amount based on the current GARA
          const newAmount = calculateSourceFromGara(garaEstimate);
          
          // Only update if value actually changed
          if (newAmount !== amount) {
            setValue("amount", newAmount, { 
              shouldValidate: false, 
              shouldDirty: false,
              shouldTouch: false
            });
          }
          
          // Update USD value for reference
          const parsedAmount = parseFloat(newAmount);
          if (!isNaN(parsedAmount)) {
            const newUsdValue = token === "USDT" || token === "USDC"
              ? parsedAmount
              : parsedAmount * (nativeUSD / 10);
              
            setInputUsdValue(newUsdValue);
            
            // Check if below minimum, but don't enforce yet
            setHasLowerInputBalance(parsedAmount < minTokenBalance);
          }
        }
      } finally {
        // Always reset the flag
        isUpdateInProgress = false;
      }
    }, 500); // Increase debounce time for more stability
    
    updateFields();
    
    return () => {
      updateFields.cancel();  // Properly cancel the debounce
    };
  }, [amount, garaEstimate, token, nativeUSD, activeInput]);
  

  // Handle token or network change
  useEffect(() => {
    console.log('handling token or network change');
    if (!token || !nativeUSD) return;
  
    setIsConverting(true);
    
    // Ensure we maintain at least the minimum value when changing tokens/networks
    const minUsdValue = 20;
    const usdValue = Math.max(inputUsdValue || 0, minUsdValue);
    
    // Convert to selected currency with minimum enforcement
    const newAmount = convertUsdToSelectedCurrency(usdValue);
    setValue("amount", newAmount);
    
    // Calculate GARA based on enforced amount
    const newGaraEstimate = calculateGaraFromSource(newAmount);
    setValue("garaEstimate", newGaraEstimate);
    
    // Update USD value reference
    setInputUsdValue(usdValue);
    
    setTimeout(() => setIsConverting(false), 500);
  }, [token, nativeUSD]);

  useEffect(() => {
    console.log('initial setup');
    // Initial setup to ensure minimum values
    const price = getCurrentPrice();
    const minUsdValue = 20;
    
    // Set initial values if not already set
    if (!amount || parseFloat(amount) === 0) {
      // Calculate minimum token amount based on $20 USD
      const minAmount = token === "USDT" || token === "USDC" 
        ? minUsdValue.toFixed(5)
        : (minUsdValue / (nativeUSD / 10)).toFixed(5);
        
      setValue("amount", minAmount);
    }
    
    if (!garaEstimate || parseFloat(garaEstimate) === 0) {
      // Calculate minimum GARA based on $20 USD
      const minGara = (minUsdValue / price).toFixed(5);
      setValue("garaEstimate", minGara);
    }
    
    // Set initial USD value
    setInputUsdValue(minUsdValue);
  }, []);

  useEffect(() => {
    console.log("showMinimumError:", showMinimumError);
    console.log("hasLowerInputBalance:", hasLowerInputBalance);
  }, [showMinimumError, hasLowerInputBalance]);

  const handleMaxButtonClick = (e) => {
    e.preventDefault();
    setIsConverting(true);
    
    // Use the currentTokenBalance value to set the max amount
    if (currentTokenBalance && parseFloat(currentTokenBalance) > 0) {
      // If it's a native token (ETH, POL, BNB), leave a small amount for gas fees
      let maxAmount;
      if (token === "ETH" || token === "POL" || token === "BNB") {
        // Leave approximately 0.01 of the native token for gas fees
        const gasBuffer = 0.01;
        maxAmount = Math.max(parseFloat(currentTokenBalance) - gasBuffer, 0);
      } else {
        // For tokens like USDT/USDC, use the full balance
        maxAmount = parseFloat(currentTokenBalance);
      }
      
      // Make sure the amount is greater than minimum required
      // Calculate the minimum token value
      const minTokenValue = token === "USDT" || token === "USDC" 
        ? 20 // $20 minimum for stablecoins
        : 20 / (nativeUSD / 10); // Convert for non-stablecoins
        
      // If max amount is less than minimum, use minimum instead
      if (maxAmount < minTokenValue) {
        maxAmount = minTokenValue;
      }
      
      // Set the amount
      setValue("amount", maxAmount.toFixed(5));
      
      // Calculate the GARA equivalent
      const newGaraEstimate = calculateGaraFromSource(maxAmount.toFixed(5));
      setValue("garaEstimate", newGaraEstimate);
      
      // Calculate USD value for tracking
      const usdValue = token === "USDT" || token === "USDC"
        ? maxAmount
        : maxAmount * (nativeUSD / 10);
        
      setInputUsdValue(usdValue);
      setActiveInput("source");
    }
    
    setTimeout(() => setIsConverting(false), 100);
  };

  useEffect(() => {
    // Check if the transaction has been completed successfully
    if (transactionStatus.process === "receivePayment" && transactionStatus.status === "paymentSent") {
      // Get transaction information from the store
      const { outcomingTransaction, incomingTransaction } = useGaraStore.getState();
      
      // Store transaction data in localStorage
      const transactionData = {
        tokenAmount: garaEstimate,
        tokenPrice: currentPrice,
        paymentToken: token,
        paymentAmount: amount,
        timestamp: new Date().toISOString(),
        txHash: outcomingTransaction.txHash
      };
      
      // Save purchase data to localStorage
      localStorage.setItem(storeDataKey, JSON.stringify(transactionData));
      localStorage.setItem("tokenPurchased", "true");
      localStorage.setItem("gara-amount", garaEstimate);
      localStorage.setItem("gara-usd-value", (parseFloat(garaEstimate) * currentPrice).toFixed(2));
  
      // Fire analytics events if available
      if (typeof gtag === "function") {
        gtag('event', 'conversion', {
          'send_to': 'AW-16542608466/FS6iCNuugJAaENLYkNA9',
          'value': parseFloat(amount),
          'currency': 'USD',
          'transaction_id': outcomingTransaction.txHash || ''
        });
      }
  
      // Call custom success callback if provided
      if (onTransactionSuccess) {
        onTransactionSuccess(transactionData);
      }
      
      // Handle redirect if path is provided
      if (thankYouRedirectPath) {
        setTimeout(() => {
          router.push(thankYouRedirectPath);
        }, 1000);
      }
    }
  }, [transactionStatus, garaEstimate, amount, token, currentPrice, onTransactionSuccess, thankYouRedirectPath, storeDataKey]);

  return (
    <section
      id="buy-gara"
      className={cn(
        "relative mb-20 w-full max-w-[420px] flex-1 rounded-2xl bg-white p-6 px-5 shadow-md lg:rounded-t-2xl lg:ml-auto",
        className
      )}
    >
      <div className="mt-4 grid grid-cols-[1fr_280px_1fr] gap-2">
        <div className="relative flex w-full flex-row items-center justify-center">
          <div className="h-[2px] w-full bg-black dark:bg-neutral-700"></div>
        </div>
        <p className="text-center font-heading text-xl font-black">Countdown to Price Increase</p>
        <div className="relative flex w-full flex-row items-center justify-center">
          <div className="h-[2px] w-full bg-black dark:bg-neutral-700"></div>
        </div>
      </div>
      <div className="my-4 flex flex-row justify-center">
        <CountdownTimer />
      </div>
      <div className="flex flex-col items-center justify-between rounded-md p-4">
        <div className="flex w-full justify-between text-lg text-gray-800">
          <span>
            Current Price: <span className="font-bold text-[#28E0B9]">${currentPrice.toFixed(2)}</span>
          </span>
          <span>
            Listing price: <span className="font-bold text-gray-900">$0.36</span>
          </span>
        </div>
        <div className="relative my-2 w-full">
          <ProgressBar
            completed={((tokenSold / 1000000) * 100).toFixed(2)}
            animateOnRender={true}
            isLabelVisible={false}
            height="16px"
            bgColor="#28E0B9"
            baseBgColor="#0D1E35"
            borderRadius="20px"
            className=""
          />
        </div>
        <p className="text-center text-lg text-gray-800">
          Raised: <span className="font-black text-gray-900">${new Intl.NumberFormat("en-US").format(tokenSold)}</span>{" "}
          / $1,000,000
        </p>
      </div>
      <div className="mt-4 grid grid-cols-[1fr_220px_1fr] gap-2 lg:hidden">
        <div className="relative flex w-full flex-row items-center justify-center">
          <div className="h-[2px] w-full bg-black dark:bg-neutral-700"></div>
        </div>
        <p className="text-center font-heading text-lg">Presale payment methods</p>
        <div className="relative flex w-full flex-row items-center justify-center">
          <div className="h-[2px] w-full bg-black dark:bg-neutral-700"></div>
        </div>
      </div>
      <div className="mt-4 flex flex-row items-center justify-between gap-2">
        <button
          onClick={() => handleNetworkSwitch("ethereum")}
          className={`group flex-1 rounded-3xl border-0 ${
            activeButton === "ethereum" ? "bg-[#024365]" : "bg-[#FFEEDC]"
          } flex h-[80px] w-[80px] flex-col items-center justify-center px-4 py-4 sm:h-12 sm:w-auto sm:flex-row sm:px-6 sm:py-2`}
        >
          <Image
            src="/images/gara-coin/ethereum.png"
            alt="Ethereum"
            width={24}
            height={24}
            className="mb-1 sm:mb-0 sm:mr-2"
          />
          <span
            className={`font-black ${
              activeButton === "ethereum" ? "text-white" : "text-black"
            } text-[10px] sm:text-base`}
          >
            <span className="hidden sm:inline">Ethereum</span>
            <span className="inline text-2xl sm:hidden">ETH</span>
          </span>
        </button>

        <button
          onClick={() => handleNetworkSwitch("polygon")}
          className={`group flex-1 rounded-3xl border-0 ${
            activeButton === "polygon" ? "bg-[#024365]" : "bg-[#FFEEDC]"
          } flex h-[80px] w-[80px] flex-col items-center justify-center px-4 py-4 sm:h-12 sm:w-auto sm:flex-row sm:px-6 sm:py-2`}
        >
          <Image
            src="/images/gara-coin/pol.png"
            alt="Polygon"
            width={24}
            height={24}
            className="mb-1 sm:mb-0 sm:mr-2"
          />
          <span
            className={`font-black ${
              activeButton === "polygon" ? "text-white" : "text-black"
            } text-[10px] sm:text-base`}
          >
            <span className="hidden sm:inline">Polygon</span>
            <span className="inline text-2xl sm:hidden">POL</span>
          </span>
        </button>

        <button
          onClick={() => handleNetworkSwitch("bsc")}
          className={`group flex-1 rounded-3xl border-0 ${
            activeButton === "bsc" ? "bg-[#024365]" : "bg-[#FFEEDC]"
          } flex h-[80px] w-[80px] flex-col items-center justify-center px-4 py-4 sm:h-12 sm:w-auto sm:flex-row sm:px-6 sm:py-2`}
        >
          <Image
            src="/images/gara-coin/bsc.png"
            alt="BSC"
            width={24}
            height={24}
            className="mb-1 sm:mb-0 sm:mr-2"
          />
          <span
            className={`font-black ${activeButton === "bsc" ? "text-white" : "text-black"} text-[10px] sm:text-base`}
          >
            <span className="hidden sm:inline">BSC</span>
            <span className="inline text-2xl sm:hidden">BSC</span>
          </span>
        </button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-full mb-4">
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col relative w-full">
            <p className="font-black">Pay with your choice</p>
            <CoinInput
              coin={token || "USDC"}
              type="number"
              placeholder="0.000"
              {...register("amount", { required: "Amount is required" })}
              onChange={handleSourceAmountChange}
              onBlur={handleSourceAmountBlur}
              showIcon={false}
              className="w-full"
              value={amount}
            />
            <div className="absolute -right-2 top-2/3 transform -translate-y-1/2">
              <CurrencySelect form={form} currentNetworkId={currentNetworkId} />
            </div>
          </div>

          <div className="flex flex-col w-full">
            <p className="font-black">Receive $GARA</p>
            <CoinInput
              coin="GARA"
              type="number"
              placeholder="0.000"
              {...register("garaEstimate", { required: "GARA amount is required" })}
              onChange={handleGaraAmountChange}
              onBlur={handleGaraAmountBlur}
              className="w-full"
              value={garaEstimate}
            />
          </div>
        </div>
        <input type="hidden" {...register("from")} />
        <input type="hidden" {...register("to")} />
        <input type="hidden" name="chain" value={chain?.name} />
        <div className="my-4 grid grid-cols-5 gap-2">
          {[50, 100, 500, 1000].map((value) => (
            <button
              key={value}
              className="group flex flex-1 items-center justify-center rounded-full border-0 bg-[#FFEEDC] p-2 font-black hover:bg-[#024365] hover:text-white"
              onClick={(e) => {
                e.preventDefault();
                setIsConverting(true);

                // Ensure preset is always above minimum
                const usdValue = Math.max(value, 20);
                
                if (activeInput === "source") {
                  const convertedValue = convertUsdToSelectedCurrency(usdValue);
                  setValue("amount", convertedValue);
                  const newGaraEstimate = calculateGaraFromSource(convertedValue);
                  setValue("garaEstimate", newGaraEstimate);
                  setInputUsdValue(usdValue);
                } else {
                  const garaValue = (usdValue / getCurrentPrice()).toFixed(5);
                  setValue("garaEstimate", garaValue);
                  const newAmount = calculateSourceFromGara(garaValue);
                  setValue("amount", newAmount);
                  setInputUsdValue(usdValue);
                }

                setTimeout(() => setIsConverting(false), 100);
              }}
            >
              {`$${value}`}
            </button>
          ))}
          <button
            className="group flex flex-1 items-center justify-center rounded-full border-0 bg-gray-200 p-2 font-black hover:bg-[#024365] hover:text-white"
            onClick={handleMaxButtonClick}
          >
            MAX
          </button>
        </div>
        {showMinimumError && (
          <div className="mt-2 pl-4 bg-red-50 border border-red-500 rounded-full p-2">
            <p className="text-sm text-red-600 font-medium">
              Minimum amount required: {token === "USDT" || token === "USDC" 
                ? 20 
                : (20 / (nativeUSD / 10)).toFixed(5)} {token}
            </p>
          </div>
        )}
        {hasUnsufficientBalance && (
          <div className="mt-2 pl-4 bg-red-50 border border-red-500 rounded-full p-2">
            <p className="text-sm text-red-600 font-medium">Insufficient balance. Your current balance: {parseFloat(currentTokenBalance).toFixed(5)} {token}</p>
          </div>
        )}
        <div className={cn("mt-2 gap-4", address ? "flex flex-col" : "flex flex-col lg:flex-row")}>
          <div className={cn("flex-1", !address && "hidden")}>
            <Button
              type="submit"
              variant={address ? "default" : "outlinePrimary"}
              disabled={!address || hasUnsufficientBalance || hasLowerInputBalance || isCalculatingMinBalance}
              className="h-12 w-full rounded-full bg-[#061022] text-center text-xl font-bold text-[#FFAE17]"
            >
              {t("btnBuyGARA")}
            </Button>
          </div>
          <div className="flex-1">
            <ConnectButton
              label={t("btnConnectWallet")}
              showBalance={false}
              className="h-12 w-full rounded-full bg-[#FF4473] text-center text-xl font-bold text-black shadow-[0px_5px_0px_#D29200]"
            />
          </div>
        </div>
        <button
          type="button" 
          onClick={getRefferalLink}
          className="w-full text-gary-yellow pt-6 px-6 rounded-full font-semibold"
        >
          + GET REFERRAL LINK
        </button>
        {showPopup && <ReferralPopup onClose={() => setShowPopup(false)} />}
        <TransactionStatusModal
          open={open}
          toggleOpen={handleOnOpenChange}
          setOpen={setOpen}
          senderChainTxUrl={chainTxUrl}
        />
      </form>
      <div className="absolute -bottom-[calc(50%+32px)] right-0 z-10 w-full h-full pointer-events-none">
        <Image src="/images/ice_buy_gara.svg" fill alt="Ice Background" className="object-contain" />
      </div>
    </section> 
  )
}