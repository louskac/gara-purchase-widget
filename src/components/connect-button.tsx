import { Button } from "./ui/button";
import { formatAddress } from "../utils/utils";
import { ConnectButton as RainbowkitConnectButton } from "@rainbow-me/rainbowkit";
import { Loader2 } from "lucide-react";
import Image from "next/image";

interface ConnectButtonProps {
  label: string;
  showBalance: boolean;
  className?: string;
}

export const ConnectButton = ({ 
  label, 
  showBalance, 
  className 
}: ConnectButtonProps) => {
  return (
    <RainbowkitConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        if (!ready) {
          return (
            <Button
              disabled
              className="h-12 w-full rounded-full bg-gray-300 text-center text-xl font-bold text-white shadow-[0px_5px_0px_#A0A0A0] outline-none"
              style={{ border: "none" }}
            >
              <Loader2 className="animate-spin" />
            </Button>
          );
        }

        return (
          <div>
            {(() => {
              if (!connected) {
                return (
                  <Button
                    variant="default"
                    onClick={openConnectModal}
                    type="button"
                    className="border-2 border-transparent hover:border-gary-yellow hover:text-gary-black h-12 w-full rounded-full bg-gary-yellow text-center text-xl font-bold text-black shadow-[0px_5px_0px_#D29200] outline-none transition-all hover:bg-white"
                  >
                    {label}
                  </Button>
                );
              }
              if (chain.unsupported) {
                return (
                  <Button
                    onClick={openChainModal}
                    type="button"
                    className="h-12 w-full rounded-full bg-red-500 text-center text-xl font-bold text-white shadow-[0px_5px_0px_#A83232] outline-none transition-all hover:bg-red-600"
                  >
                    Wrong network
                  </Button>
                );
              }
              return (
                <div style={{ display: "flex", gap: 12 }}>
                  {/* Chain Info Button */}
                  <Button
                    variant="outline"
                    onClick={openChainModal}
                    type="button"
                    className="h-12 rounded-full border-2 border-[#FFAE17] bg-transparent text-[#FFAE17] shadow-[0px_5px_0px_#D29200] hover:bg-[#FFAE17] hover:text-black"
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          overflow: "hidden",
                          marginRight: 8,
                        }}
                      >
                        {chain.iconUrl && (
                          <Image
                            src={chain.iconUrl}
                            alt={chain.name ?? "Chain icon"}
                            width={20}
                            height={20}
                          />
                        )}
                      </div>
                    )}
                    {chain.name}
                  </Button>

                  {/* Account Info Button */}
                  <Button
                    variant="outline"
                    onClick={openAccountModal}
                    type="button"
                    className="h-12 w-full rounded-full border-2 border-[#FFAE17] bg-transparent text-[#FFAE17] shadow-[0px_5px_0px_#D29200] hover:bg-[#FFAE17] hover:text-black"
                  >
                    {formatAddress(account.address, 12)}
                    {showBalance ? ` (${account.displayBalance})` : ""}
                  </Button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </RainbowkitConnectButton.Custom>
  );
};
