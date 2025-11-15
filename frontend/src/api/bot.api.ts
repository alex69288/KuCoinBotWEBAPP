import axios from 'axios';

const API_BASE_URL = ((typeof window !== 'undefined' && (window as any).VITE_API_URL) || process.env?.VITE_API_URL || 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Bot management API functions
export const botApi = {
  // Get bot status
  getStatus: async () => {
    const response = await api.get('/bot/status');
    return response.data;
  },

  // Start bot
  start: async () => {
    const response = await api.post('/bot/start');
    return response.data;
  },

  // Stop bot
  stop: async () => {
    const response = await api.post('/bot/stop');
    return response.data;
  },

  // Get bot configuration
  getConfig: async () => {
    const response = await api.get('/bot/config');
    return response.data;
  },

  // Update bot configuration
  updateConfig: async (config: any) => {
    const response = await api.put('/bot/config', config);
    return response.data;
  },

  // Get available strategies
  getStrategies: async () => {
    const response = await api.get('/bot/strategies');
    return response.data;
  },

  // Get trading statistics
  getStats: async () => {
    const response = await api.get('/bot/stats');
    return response.data;
  },

  // Get market data for charts
  getMarketData: async (symbol: string, timeframe = '1h', limit = 100) => {
    const response = await api.get(`/bot/market-data/${symbol}`, {
      params: { timeframe, limit }
    });
    return response.data;
  },

  // Manual trade
  manualTrade: async (tradeData: {
    symbol: string;
    side: 'buy' | 'sell';
    amount: number;
    type?: 'market' | 'limit';
    price?: number;
  }) => {
    const response = await api.post('/bot/trade', tradeData);
    return response.data;
  },

  // Start bot
  startBot: async () => {
    return await botApi.start();
  },

  // Stop bot
  stopBot: async () => {
    return await botApi.stop();
  },

  // Enable or disable demo mode
  setDemoMode: async (enabled: boolean) => {
    const response = await api.post('/bot/demo-mode', { enabled });
    return response.data;
  },

  // Get demo trades
  getDemoTrades: async () => {
    const response = await api.get('/bot/demo-trades');
    return response.data;
  },

  // Clear demo trades
  clearDemoTrades: async () => {
    const response = await api.delete('/bot/demo-trades');
    return response.data;
  },

  // Get market update
  getMarketUpdate: async () => {
    const response = await api.get('/bot/market-update');
    return response.data;
  },
};

export default api;