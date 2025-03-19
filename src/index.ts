// Export components
export { CoinInput } from './components/coin-input';
export { ConnectButton } from './components/connect-button';
export { CurrencySelect } from './components/currency-select';
export { default as TransactionStatusModal } from './components/transaction-status-modal';
export { WalletProviders } from './components/wallet-providers';
export { BuyGara } from './components/widget';
export { default as CountdownTimer } from './components/countdown-timer';

// Export utilities
export { sendPayment } from './lib/send-payment';
export { getTokenBalance } from './lib/get-balance';
export { cn, formatAmount, getGaraEstimate, usdcToGara } from './utils/utils';

// Export types
export * from './types';

// Export store
export { useGaraStore } from './lib/store/provider';

// Export theme utilities
export const createWidgetTheme = (config: {
  primaryColor: string;
  secondaryColor: string;
  [key: string]: any;
}) => {
  return config;
};