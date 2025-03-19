"use client"
import { Check, ChevronDown } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "../utils/utils"
import { Button } from "./ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import Image from "next/image"
import { useAccount } from "wagmi"

// Define available tokens per chain with no overlap
const ethTokens = [
  { label: "ETH", value: "ETH" },
  { label: "USDC", value: "USDC" },
] as const

const bnbTokens = [
  { label: "BNB", value: "BNB" },
  { label: "USDT", value: "USDT" },
  { label: "USDC", value: "USDC" },
] as const

const polTokens = [
  { label: "POL", value: "POL" },
  { label: "USDT", value: "USDT" },
  { label: "USDC", value: "USDC" },
] as const

export function CurrencySelect({ form, currentNetworkId }) {
  const { chain, address } = useAccount()
  const [isReady, setIsReady] = useState(false)
  
  // Run once on component mount to set initial default tokens
  useEffect(() => {
    // Skip if form isn't available yet
    if (!form) return;
    
    // Force a default token based on current network
    const networkId = chain?.id || currentNetworkId;
    
    // Set appropriate default token
    let defaultToken;
    if (networkId === 1) {
      defaultToken = "USDC";
    } else {
      defaultToken = "USDT";
    }
    
    // Force set the token value
    console.log(`Initial setup: Setting token to ${defaultToken} for network ${networkId}`);
    form.setValue("token", defaultToken, { shouldDirty: false, shouldValidate: false });
    
    // Delay setting isReady to ensure rendering happens after state update
    setTimeout(() => {
      setIsReady(true);
    }, 50);
  }, [form]);
  
  // Run when network changes to update tokens
  useEffect(() => {
    if (!isReady || !form) return;
    
    const networkId = chain?.id || currentNetworkId;
    
    // Set appropriate default token for network changes
    let defaultToken;
    if (networkId === 1) {
      defaultToken = "USDC";
    } else {
      defaultToken = "USDT";
    }
    
    // Update token value when network changes
    console.log(`Network change: Setting token to ${defaultToken} for network ${networkId}`);
    form.setValue("token", defaultToken, { shouldDirty: false });
  }, [chain?.id, currentNetworkId, isReady]);

  // Function to get appropriate tokens for current network
  const getTokensForNetwork = (networkId) => {
    if (networkId === 1) return ethTokens;
    if (networkId === 137) return polTokens;
    if (networkId === 56) return bnbTokens;
    return ethTokens; // Default fallback
  }

  // Only render when ready and token value exists
  const tokenValue = form?.getValues("token");
  if (!isReady || !tokenValue) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="!mt-2 h-[24px] w-full justify-between rounded-full border-none bg-transparent !p-0 font-bold text-gary-blue"
        >
          <Image
            src={`/icons/coins/${tokenValue.toLowerCase()}.png`}
            alt={tokenValue}
            width={32}
            height={32}
          />
          <ChevronDown className="mr-4 h-8 w-8 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[150px] p-0">
        <Command>
          <CommandList>
            <CommandEmpty>No coin found.</CommandEmpty>
            <CommandGroup>
              {getTokensForNetwork(chain?.id || currentNetworkId).map(token => (
                <CommandItem
                  key={token.value}
                  value={token.label}
                  onSelect={() => {
                    form.setValue("token", token.value);
                  }}
                  className="text-white"
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", token.value === tokenValue ? "opacity-100" : "opacity-10")}
                  />
                  <Image
                    src={`/icons/coins/${token.value.toLowerCase()}.png`}
                    alt={token.value}
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                  {token.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}