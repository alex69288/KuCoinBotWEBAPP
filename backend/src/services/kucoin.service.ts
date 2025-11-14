import ccxt from 'ccxt';

export class KuCoinService {
  private exchange: any;

  constructor() {
    this.exchange = new ccxt.kucoin({
      apiKey: process.env.KUCOIN_API_KEY,
      secret: process.env.KUCOIN_API_SECRET,
      password: process.env.KUCOIN_API_PASSPHRASE,
      // KuCoin doesn't support sandbox mode
      // sandbox: !process.env.KUCOIN_API_KEY,
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

  async getHistoricalData(symbol: string, timeframe: string = '1h', limit: number = 100): Promise<any[]> {
    try {
      const ohlcv = await this.exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
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

  async getOrderHistory(symbol?: string, limit: number = 50): Promise<any[]> {
    try {
      return await this.exchange.fetchClosedOrders(symbol, undefined, limit);
    } catch (error) {
      console.error('Error fetching order history:', error);
      throw error;
    }
  }

  async getTrades(symbol?: string, limit: number = 50): Promise<any[]> {
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

export const kucoinService = new KuCoinService();