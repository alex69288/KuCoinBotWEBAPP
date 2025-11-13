import { create } from 'zustand';

interface TradingState {
  balance: any;
  markets: any[];
  selectedSymbol: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  setBalance: (balance: any) => void;
  setMarkets: (markets: any[]) => void;
  setSelectedSymbol: (symbol: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTradingStore = create<TradingState>((set) => ({
  balance: null,
  markets: [],
  selectedSymbol: 'BTC/USDT',
  isLoading: false,
  error: null,

  setBalance: (balance) => set({ balance }),
  setMarkets: (markets) => set({ markets }),
  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));