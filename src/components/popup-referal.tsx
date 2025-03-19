"use client"

import React, { useEffect, useState } from "react"
import { Button } from "./ui/button"
import { ConnectButton } from "./connect-button"
import { useTranslations } from "next-intl"
import { useAccount } from "wagmi"
import { formatAddress } from "../utils/utils"
import crypto from 'crypto'
import axios from 'axios'
import { Copy, Check } from "lucide-react"

const BACKEND_ENDPOINT = process.env.NEXT_PUBLIC_BACKEND_ENDPOINT

export const ReferralPopup = ({ onClose }: { onClose: () => void }) => {
  const t = useTranslations("GARA.main.buyGARA")
  const { address } = useAccount()

  const [isConnected, setIsConnected] = useState(false)
  const [referralCode, setReferralCode] = useState<string>('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const getReferral = async (walletAddress: string) => {
      const result = await axios.post(`${BACKEND_ENDPOINT}/user/getReferral`, { walletAddress })
      const referral = result.data.data
      setReferralCode(referral)
    }

    if (address) {
      setIsConnected(true)
      getReferral(address)
    }
  }, [address])

  const generateReferralCode = () => {
    const setReferral = async (walletAddress: string, referral: string) => {
      await axios.post(`${BACKEND_ENDPOINT}/user/setReferral`, { walletAddress, referral })
    }

    if (address) {
      const referral = 'GARA-' + crypto.createHash("sha256").update(address).digest("hex").slice(0, 8).toUpperCase()
      setReferralCode(referral)
      setReferral(address, referral)
    }
  }

  const copyToClipboard = () => {
    if (referralCode) {
      const referralText = `https://www.helpgary.com/en?ref=${referralCode}`
      navigator.clipboard.writeText(referralText).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-md rounded-2xl bg-gradient-to-b from-white to-[#CFEFFF] p-6 text-center shadow-lg">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-[14px] top-[7px] text-3xl font-bold text-gray-500 hover:text-black"
        >
          &times;
        </button>

        {/* Initial State */}
        {!isConnected && (
          <>
            <p className="text-center font-heading text-xl font-black mb-6 mt-2">Thank you for choosing to promote $GARA!</p>
            <p className="mb-4 text-lg font-semibold text-gray-800">
              Earn up to 10% reward in USDT on purchases made through your referral link!
            </p>
            <div className="mb-6 rounded-lg bg-gray-300 p-3 text-sm text-gray-600">
              To get your unique referral link, please connect your wallet first.
            </div>
            <ConnectButton
              label={t("btnConnectWallet")}
              showBalance={false}
            />
          </>
        )}

        {/* Connected State */}
        {isConnected && (
          <>
            <p className="text-center font-heading text-xl font-black mb-6 mt-2">Thank you for choosing to promote $GARA!</p>
            <p className="mb-4 text-lg font-semibold text-gray-800">
              Earn up to 10% reward in USDT on purchases made through your referral link!
            </p>

            {/* Generate Code Button / Code Display */}
            {!referralCode ? (
              <Button
                onClick={generateReferralCode}
                className="border-2 border-transparent hover:border-gary-yellow hover:text-gary-yellow h-12 w-full rounded-full bg-gary-yellow text-center text-xl font-bold text-black shadow-[0px_5px_0px_#D29200] outline-none transition-all hover:bg-white"
              >
                Generate Code
              </Button>
            ) : (
              <div className="mt-4 flex items-center justify-between rounded-full border-2 border-[#FFAE17] bg-white p-3 shadow-[0px_5px_0px_#D29200]">
                <span className="text-lg font-semibold text-gray-800">{`https://www.helpgary.com/en?ref=${referralCode}`}</span>
                <div className="flex items-center gap-2 mr-4">
                  <button
                    onClick={(e) => {
                      e.preventDefault() // Prevent default form submission behavior
                      copyToClipboard()
                    }}
                    className="ml-2 font-bold text-gary-yellow hover:text-black"
                    aria-label="Copy address"
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>
            )}

            <div className="my-4 rounded-lg bg-gray-300 p-3 text-lg font-bold text-gray-700">
              Connected Wallet ({formatAddress(address, 5)})
            </div>
            <div className="mt-4 mx-auto w-fit rounded-full bg-green-500 py-2 px-4 text-white font-semibold">
              Referral Active
            </div>
          </>
        )}
      </div>
    </div>
  )
}