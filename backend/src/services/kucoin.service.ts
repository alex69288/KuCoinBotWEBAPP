import ccxt from 'ccxt';

export class KuCoinService {
  private exchange: any;

  constructor() {
    this.exchange = new ccxt.kucoin({
      apiKey: process.env.KUCOIN_API_KEY,
      secret: process.env.KUCOIN_API_SECRET,
      password: process.env.KUCOIN_API_PASSPHRASE,
      sandbox: !process.env.KUCOIN_API_KEY, // Use sandbox if no API key
    });
  }

  async getBalance(): Promise<any> {
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
    try {
      return await this.exchange.createOrder(symbol, type, side, amount, price);
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async getOpenOrders(symbol?: string): Promise<any[]> {
    try {
      return await this.exchange.fetchOpenOrders(symbol);
    } catch (error) {
      console.error('Error fetching open orders:', error);
      throw error;
    }
  }

  async cancelOrder(orderId: string, symbol?: string): Promise<any> {
    try {
      return await this.exchange.cancelOrder(orderId, symbol);
    } catch (error) {
      console.error('Error canceling order:', error);
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

export const kucoinService = new KuCoinService();