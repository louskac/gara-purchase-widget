"use client"

import { useEffect } from "react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./ui/dialog"
import { Button } from "./ui/button"
import { ArrowDownRight, ArrowUpRight, Check, ExternalLink, Loader2Icon, X } from "lucide-react"
import { useGaraStore } from "../lib/store/provider"
import { Skeleton } from "./ui/skeleton"
import { formatAddress } from "../utils/utils"
import { useRouter } from "next/navigation"

export default function TransactionStatusModal({ open, setOpen, toggleOpen, senderChainTxUrl }) {
  const { transactionStatus, incomingTransaction, outcomingTransaction, reset } = useGaraStore((state) => state)
  const hasFinished = outcomingTransaction.done && !outcomingTransaction.error
  const isPending = !hasFinished && (!incomingTransaction.done || !outcomingTransaction.done);
  const hasFailed = incomingTransaction.error || outcomingTransaction.error
  const router = useRouter()

    // Save purchase status to local storage when the transaction finishes successfully
    useEffect(() => {
      if (hasFinished) {
        localStorage.setItem("tokenPurchased", "true");
      }
    }, [hasFinished])

  return (
    <Dialog onOpenChange={toggleOpen} open={open}>
      {/* <DialogTrigger asChild>
        <Button variant="outline">View Transactions</Button>
      </DialogTrigger> */}
      <DialogContent
        className="sm:max-w-[600px]"
        onEscapeKeyDown={() => null}
        onPointerDown={(e) => (isPending ? e.preventDefault() : null)}
        onInteractOutside={(e) => (isPending ? e.preventDefault() : null)}
      >
        <DialogHeader>
          <DialogTitle className="sr-only text-foreground dark:text-white">Transaction</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6">
          <div>
            <div className="mb-12">
              {isPending ? (
                <div className="flex h-14 w-full items-center justify-center rounded-full bg-yellow-500 text-foreground dark:text-white">
                  <Loader2Icon className="mx-auto size-10 animate-spin" />
                </div>
              ) : null}
              {hasFinished ? (
                <div className="flex h-14 w-full items-center justify-center rounded-full bg-green-500 text-foreground dark:text-white">
                  <Check className="size-10" />
                </div>
              ) : null}
              {hasFailed ? (
                <div className="flex h-14 w-full items-center justify-center rounded-full bg-red-500 text-foreground dark:text-white">
                  <X className="size-10" />
                </div>
              ) : null}
            </div>
            <h3 className="mb-2 w-full text-center font-heading text-lg font-medium text-foreground dark:text-white">
              <ArrowUpRight className="inline-block h-6 w-6" />
              Outgoing Transaction
            </h3>
            <div className="grid gap-4">
              <div className="grid grid-rows-[1fr_auto] items-center gap-4 rounded-md border border-neutral-200 bg-neutral-100 p-4 dark:border-neutral-700 dark:bg-neutral-800 md:grid-cols-[1fr_auto] md:grid-rows-1">
                <div>
                  <p className="text-sm font-medium text-foreground dark:text-white">Transaction Hash</p>
                  {outcomingTransaction.txHash ? (
                    <a
                      href={`${senderChainTxUrl}${outcomingTransaction.txHash}`}
                      className="text-tertiary/80 hover:text-tertiary inline-flex items-center text-sm underline dark:text-white"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {formatAddress(outcomingTransaction.txHash)}
                    </a>
                  ) : (
                    <Skeleton className="mt-1 h-5 w-48 bg-neutral-300 dark:bg-neutral-600" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!outcomingTransaction.done ? (
                    <>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500 dark:text-white">
                        <X className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-medium text-yellow-500">Transaction Pending</p>
                    </>
                  ) : null}
                  {outcomingTransaction.error ? (
                    <>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-foreground dark:text-white">
                        <X className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-medium text-red-500">Transaction Failed</p>
                    </>
                  ) : null}
                  {outcomingTransaction.done && !outcomingTransaction.error ? (
                    <>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-foreground dark:text-white">
                        <Check className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-medium text-green-500">Transaction Completed</p>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <div>
            {!isPending ? (
              <Button type="button" onClick={toggleOpen} className="dark:text-foreground">
                Close
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}