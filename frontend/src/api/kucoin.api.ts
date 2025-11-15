import axios from 'axios';

const getApiBase = () => {
  // Prefer runtime config from window (tests or runtime injection)
  if (typeof window !== 'undefined' && (window as any).VITE_API_URL) return (window as any).VITE_API_URL;

  // Fallback to Node env (e.g., in tests or server-side scenarios)
  if (typeof process !== 'undefined' && (process as any).env?.VITE_API_URL) return (process as any).env.VITE_API_URL;

  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBase();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// KuCoin API functions
export const kucoinApi = {
  // Get balance
  getBalance: async () => {
    const response = await api.get('/kucoin/balance');
    return response.data;
  },

  // Get ticker
  getTicker: async (symbol: string) => {
    const response = await api.get(`/kucoin/ticker/${symbol}`);
    return response.data;
  },

  // Get order book
  getOrderBook: async (symbol: string, limit = 20) => {
    const response = await api.get(`/kucoin/orderbook/${symbol}`, {
      params: { limit }
    });
    return response.data;
  },

  // Create order
  createOrder: async (orderData: {
    symbol: string;
    type: 'limit' | 'market';
    side: 'buy' | 'sell';
    amount: number;
    price?: number;
    userId?: string;
  }) => {
    const response = await api.post('/kucoin/orders', orderData);
    return response.data;
  },

  // Get open orders
  getOpenOrders: async (symbol?: string) => {
    const response = await api.get('/kucoin/orders/open', {
      params: { symbol }
    });
    return response.data;
  },

  // Get order history
  getOrderHistory: async (symbol?: string, limit = 50) => {
    const response = await api.get('/kucoin/orders/history', {
      params: { symbol, limit }
    });
    return response.data;
  },

  // Get trades
  getTrades: async (symbol?: string, limit = 50) => {
    const response = await api.get('/kucoin/trades', {
      params: { symbol, limit }
    });
    return response.data;
  },

  // Cancel order
  cancelOrder: async (orderId: string, symbol?: string) => {
    const response = await api.delete(`/kucoin/orders/${orderId}`, {
      params: { symbol }
    });
    return response.data;
  },

  // Get markets
  getMarkets: async () => {
    const response = await api.get('/kucoin/markets');
    return response.data;
  },
};

export default api;