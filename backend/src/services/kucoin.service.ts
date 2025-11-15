import ccxt from 'ccxt';

export class KuCoinService {
  private exchange: any;
  private hasCredentials: boolean;
  private id: number;

  constructor() {
    this.id = Math.random();
    console.log('Creating KuCoinService instance', this.id);
    const apiKey = process.env.KUCOIN_API_KEY;
    const secret = process.env.KUCOIN_API_SECRET;
    const password = process.env.KUCOIN_API_PASSPHRASE;

    this.hasCredentials = !!(apiKey && secret && password);

    console.log('Initializing KuCoin with the following credentials:');
    console.log('apiKey:', apiKey);
    console.log('secret:', secret);
    console.log('password:', password);

    this.exchange = new ccxt.kucoin({
      apiKey: apiKey || undefined,
      secret: secret || undefined,
      password: password || undefined,
    });

    console.log('KuCoin exchange initialized:', this.exchange ? 'Success' : 'Failed');
    console.log('Credentials available:', this.hasCredentials ? 'Yes' : 'No');
  }

  async getBalance(): Promise<any> {
    if (!this.hasCredentials) {
      console.warn('No KuCoin credentials provided, returning empty balance');
      return {};
    }
    try {
      return await this.exchange.fetchBalance();
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw error;
    }
  }

  async getTicker(symbol: string): Promise<any> {
    try {
      return await this.exchange.fetchTicker(symbol);
    } catch (error) {
      console.error('Error fetching ticker:', error);
      throw error;
    }
  }

  async getOrderBook(symbol: string, limit: number = 20): Promise<any> {
    try {
      return await this.exchange.fetchOrderBook(symbol, limit);
    } catch (error) {
      console.error('Error fetching order book:', error);
      throw error;
    }
  }

  async createOrder(symbol: string, type: 'limit' | 'market', side: 'buy' | 'sell', amount: number, price?: number): Promise<any> {
    if (!this.hasCredentials) {
      throw new Error('KuCoin credentials are required to create orders');
    }
    try {
      return await this.exchange.createOrder(symbol, type, side, amount, price);
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async placeOrder(symbol: string, side: 'buy' | 'sell', amount: number): Promise<any> {
    return await this.createOrder(symbol, 'market', side, amount);
  }

  async getHistoricalData(symbol: string, timeframe: string = '1h', limit: number = 100): Promise<any[]> {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      const fetchPromise = this.exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
      const ohlcv = await Promise.race([fetchPromise, timeoutPromise]) as any[];
      return ohlcv.map((candle: any) => ({
        timestamp: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5]
      }));
    } catch (error) {
      console.error('Error fetching historical data:', error);
      // Return empty array to continue without data
      return [];
    }
  }

  async getOpenOrders(symbol?: string): Promise<any[]> {
    console.log('getOpenOrders: id =', this.id, 'hasCredentials =', this.hasCredentials);
    if (!this.hasCredentials) {
      console.warn('No KuCoin credentials provided, returning empty orders');
      return [];
    }
    try {
      return await this.exchange.fetchOpenOrders(symbol);
    } catch (error) {
      console.error('Error fetching open orders:', error);
      throw error;
    }
  }

  async cancelOrder(orderId: string, symbol?: string): Promise<any> {
    if (!this.hasCredentials) {
      throw new Error('KuCoin credentials are required to cancel orders');
    }
    try {
      return await this.exchange.cancelOrder(orderId, symbol);
    } catch (error) {
      console.error('Error canceling order:', error);
      throw error;
    }
  }

  async getOrderHistory(symbol?: string, limit: number = 50): Promise<any[]> {
    if (!this.hasCredentials) {
      console.warn('No KuCoin credentials provided, returning empty order history');
      return [];
    }
    try {
      return await this.exchange.fetchClosedOrders(symbol, undefined, limit);
    } catch (error) {
      console.error('Error fetching order history:', error);
      throw error;
    }
  }

  async getTrades(symbol?: string, limit: number = 50): Promise<any[]> {
    if (!this.hasCredentials) {
      console.warn('No KuCoin credentials provided, returning empty trades');
      return [];
    }
    try {
      return await this.exchange.fetchMyTrades(symbol, undefined, limit);
    } catch (error) {
      console.error('Error fetching trades:', error);
      throw error;
    }
  }

  async getMarkets(): Promise<any[]> {
    try {
      return await this.exchange.loadMarkets();
    } catch (error) {
      console.error('Error loading markets:', error);
      throw error;
    }
  }
}

export const kucoinService = (() => {
  let instance: KuCoinService | null = null;
  return () => {
    console.log('kucoinService called, instance exists:', !!instance);
    if (!instance) {
      console.log('Creating new instance');
      instance = new KuCoinService();
    } else {
      // id is a private property; log with a cast to any to avoid TS error
      console.log('Returning existing instance', (instance as any).id);
    }
    return instance;
  };
})();