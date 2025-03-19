export type HexAddress = `0x${string}`

/**
 *  Any type that can be used where a numeric value is needed.
 */
export type Numeric = number | bigint

/**
 *  Any type that can be used where a big number is needed.
 */
export type BigNumberish = string | Numeric

export type SupportedChains = "Polygon" | "Ethereum" | "BNB Smart Chain"
export type SupportedTokens = "USDC" | "USDT" | "ETH" | "POL" | "BNB"
