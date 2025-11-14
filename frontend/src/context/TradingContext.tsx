import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TradingState {
  balance: any;
  markets: any[];
  selectedSymbol: string;
  isLoading: boolean;
  error: string | null;
}

interface TradingContextType extends TradingState {
  setBalance: (balance: any) => void;
  setMarkets: (markets: any[]) => void;
  setSelectedSymbol: (symbol: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export const useTradingContext = () => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTradingContext must be used within a TradingProvider');
  }
  return context;
};

interface TradingProviderProps {
  children: ReactNode;
}

export const TradingProvider: React.FC<TradingProviderProps> = ({ children }) => {
  const [balance, setBalance] = useState<any>(null);
  const [markets, setMarkets] = useState<any[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC/USDT');
  const [isLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const value: TradingContextType = {
    balance,
    markets,
    selectedSymbol,
    isLoading,
    error,
    setBalance,
    setMarkets,
    setSelectedSymbol,
    setLoading,
    setError,
  };

  return (
    <TradingContext.Provider value={value}>
      {children}
    </TradingContext.Provider>
  );
};