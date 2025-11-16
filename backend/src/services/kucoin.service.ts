import ccxt from 'ccxt';

/**
 * Реальный KuCoin сервис (использует ccxt)
 */
export class KuCoinService {
  private exchange: any;
  protected hasCredentials: boolean = false;
  public id: string | number = 0; // Поддержка строк и чисел

  public isDemoMode: boolean = false; // Флаг для демо-режима

  constructor() {
    this.id = Math.random();
    console.log('Creating KuCoinService instance', this.id);
    const apiKey = process.env.KUCOIN_API_KEY;
    const secret = process.env.KUCOIN_API_SECRET;
    const password = process.env.KUCOIN_API_PASSPHRASE;

    this.hasCredentials = !!(apiKey && secret && password);

    console.log('Initializing KuCoin with the following credentials:');
    console.log('apiKey:', apiKey ? '***' : 'none');
    console.log('secret:', secret ? '***' : 'none');
    console.log('password:', password ? '***' : 'none');

    this.exchange = new ccxt.kucoin({
      apiKey: apiKey || undefined,
      secret: secret || undefined,
      password: password || undefined,
    });

    console.log('KuCoin exchange initialized:', this.exchange ? 'Success' : 'Failed');
    console.log('Credentials available:', this.hasCredentials ? 'Yes' : 'No');
  }

  // help runtime detection
  public isDemo: boolean = false; // Поддержка true/false

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
      if (this.isDemoMode) {
        console.log('Demo mode enabled: returning mock historical data');
        return Array(limit).fill(0).map((_, i) => ({
          timestamp: Date.now() - i * 3600000,
          open: 100 + i,
          high: 105 + i,
          low: 95 + i,
          close: 100 + i,
          volume: 10 * i
        }));
      }

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
      const raw = await this.exchange.fetchOpenOrders(symbol);
      try { console.log(`fetchOpenOrders raw length=${Array.isArray(raw) ? raw.length : 0}`, symbol || 'all'); } catch (e) { console.log('fetchOpenOrders raw logging failed', e) }
      return raw;
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
      console.log('getOrderHistory: fetching closed orders', { symbol, limit, id: this.id });
      const raw = await this.exchange.fetchClosedOrders(symbol, undefined, limit);
      try { console.log('fetchClosedOrders raw sample:', Array.isArray(raw) ? raw.slice(0, 3) : raw); } catch (e) { console.log('fetchClosedOrders raw logging failed', e) }
      return raw;
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
      console.log('getTrades: fetching my trades', { symbol, limit, id: this.id });
      const raw = await this.exchange.fetchMyTrades(symbol, undefined, limit);
      try { console.log('fetchMyTrades raw sample:', Array.isArray(raw) ? raw.slice(0, 3) : raw); } catch (e) { console.log('fetchMyTrades raw logging failed', e) }
      return raw;
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

  // Optional: seed demo prices when switching to demo mode (no-op for real service)
  public setDemoSeedPrices(_prices: Record<string, number>): void {
    // no-op in real service
  }
}

/**
 * Demo implementation: полностью эмулирует поведение биржи в памяти.
 */
export class DemoKuCoinService extends KuCoinService {
  protected hasCredentials: boolean = false;
  private balances: any = {};
  private prices: any = {};
  private openOrders: any[] = [];
  private trades: any[] = [];
  private markets: any[] = [];

  constructor() {
    super();
    this.hasCredentials = false;
    // Seed realistic demo prices and balances for common symbols
    this.prices = this.prices || {};
    this.prices['BTC/USDT'] = 50000;
    this.prices['ETH/USDT'] = 4000;
    this.prices['USDT'] = 1;
    this.markets = ['BTC/USDT', 'ETH/USDT'];
    this.balances = {
      total: { USDT: 1000 },
      free: { USDT: 1000 },
      used: { USDT: 0 }
    };
  }

  // help runtime detection
  public isDemo: true = true as const;

  async getBalance(): Promise<any> {
    return this.balances;
  }

  private nowPrice(symbol: string): number {
    const base = this.prices[symbol] || 1;
    // gentle pseudo-random walk based on time
    const t = Math.floor(Date.now() / 10000);
    const delta = Math.sin(t / 10 + (symbol.length)) * (base * 0.005);
    const price = +(base + delta).toFixed(8);
    return price;
  }

  async getTicker(symbol: string): Promise<any> {
    // Prefer real ticker data when available (public endpoints work without creds)
    try {
      const real = await super.getTicker(symbol);
      if (real && typeof real.last === 'number') return real;
    } catch (e) {
      // ignore and fallback to synthetic
    }
    const last = this.nowPrice(symbol);
    return {
      symbol,
      last,
      bid: +(last * 0.999).toFixed(8),
      ask: +(last * 1.001).toFixed(8),
      percentage: 0
    };
  }

  async getOrderBook(symbol: string, limit: number = 20): Promise<any> {
    // Prefer real order book (public endpoint). Fallback to synthetic if unavailable.
    try {
      const real = await super.getOrderBook(symbol, limit);
      if (real && (real.bids || real.asks)) return real;
    } catch (e) {
      // ignore and fallback
    }
    const mid = this.nowPrice(symbol);
    const bids = [] as any[];
    const asks = [] as any[];
    for (let i = 0; i < limit; i++) {
      bids.push([+(mid * (1 - i * 0.0005)).toFixed(8), +(1 + Math.random()).toFixed(8)]);
      asks.push([+(mid * (1 + i * 0.0005)).toFixed(8), +(1 + Math.random()).toFixed(8)]);
    }
    return { bids, asks, timestamp: Date.now() };
  }

  async createOrder(symbol: string, type: 'limit' | 'market', side: 'buy' | 'sell', amount: number, price?: number): Promise<any> {
    const id = `demo-order-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const current = this.nowPrice(symbol);
    let status = 'closed';
    let filled = amount;
    let avgPrice = current;

    if (type === 'limit' && price && ((side === 'buy' && price < current) || (side === 'sell' && price > current))) {
      // Not immediately filled
      status = 'open';
      filled = 0;
      avgPrice = price;
      this.openOrders.push({ id, symbol, type, side, amount, price, status, timestamp: Date.now() });
    } else {
      // Immediate fill simulation
      avgPrice = price || current;
      this.trades.push({ id, symbol, side, amount, price: avgPrice, timestamp: Date.now() });
      // adjust balances (simple): if buy - reduce USDT, if sell - increase USDT
      const cost = amount * avgPrice;
      if (side === 'buy') {
        this.balances.total.USDT = +(this.balances.total.USDT - cost).toFixed(8);
      } else {
        this.balances.total.USDT = +(this.balances.total.USDT + cost).toFixed(8);
      }
    }

    return { id, symbol, type, side, amount, price: avgPrice, status, filled };
  }

  async placeOrder(symbol: string, side: 'buy' | 'sell', amount: number): Promise<any> {
    return await this.createOrder(symbol, 'market', side, amount);
  }

  async getHistoricalData(symbol: string, timeframe: string = '1h', limit: number = 100): Promise<any[]> {
    console.log('DemoKuCoinService: getHistoricalData for', symbol, timeframe, limit, '- preferring real data');
    try {
      const real = await super.getHistoricalData(symbol, timeframe, limit);
      if (Array.isArray(real) && real.length > 0) {
        return real;
      }
    } catch (e) {
      // fallback to synthetic below
      console.warn('DemoKuCoinService: failed to fetch real historical data, falling back to synthetic', String(e));
    }

    // synthetic fallback (time-aware random walk)
    const base = this.prices[symbol] || 100;
    const now = Date.now();
    const timeframeMs = (tf: string) => {
      if (tf.endsWith('m')) return parseInt(tf) * 60 * 1000;
      if (tf.endsWith('h')) return parseInt(tf) * 60 * 60 * 1000;
      if (tf.endsWith('d')) return parseInt(tf) * 24 * 60 * 60 * 1000;
      return 60 * 60 * 1000; // default 1h
    };
    const step = timeframeMs(timeframe);
    let price = base;
    const out: any[] = [];
    for (let i = limit - 1; i >= 0; i--) {
      const ts = now - i * step;
      // small random walk
      const drift = (Math.random() - 0.5) * 0.01; // up to ±0.5% per candle
      const open = +(price).toFixed(8);
      const close = +(price * (1 + drift)).toFixed(8);
      const high = +(Math.max(open, close) * (1 + Math.random() * 0.002)).toFixed(8);
      const low = +(Math.min(open, close) * (1 - Math.random() * 0.002)).toFixed(8);
      const volume = +(Math.random() * 10).toFixed(3);
      out.push({ timestamp: ts, open, high, low, close, volume });
      price = close;
    }
    // update last price for the symbol so ticker/nowPrice reflect recent generation
    this.prices[symbol] = price;
    return out;
  }

  async getOpenOrders(symbol?: string): Promise<any[]> {
    if (symbol) return this.openOrders.filter(o => o.symbol === symbol);
    return this.openOrders;
  }

  async cancelOrder(orderId: string, symbol?: string): Promise<any> {
    const idx = this.openOrders.findIndex(o => o.id === orderId);
    if (idx === -1) throw new Error('Order not found');
    const [removed] = this.openOrders.splice(idx, 1);
    removed.status = 'canceled';
    return removed;
  }

  async getOrderHistory(symbol?: string, limit: number = 50): Promise<any[]> {
    const history = symbol ? this.trades.filter(t => t.symbol === symbol) : this.trades;
    return history.slice(-limit).reverse();
  }

  async getTrades(symbol?: string, limit: number = 50): Promise<any[]> {
    return this.getOrderHistory(symbol, limit);
  }

  async getMarkets(): Promise<any[]> {
    return this.markets.map(m => ({ symbol: m }));
  }

  // Allow seeding demo prices from real market snapshot
  public setDemoSeedPrices(prices: Record<string, number>): void {
    try {
      this.prices = { ...(this.prices || {}), ...(prices || {}) };
    } catch (e) {
      // ignore
    }
  }
}

export const kucoinService = (() => {
  let instance: KuCoinService | DemoKuCoinService | null = null;
  let currentDemoMode: boolean | null = null;

  const createInstance = (isDemo: boolean) => {
    console.log('kucoinService: creating instance, demo=', isDemo);
    return isDemo ? new DemoKuCoinService() : new KuCoinService();
  };

  return {
    getInstance: () => {
      const isDemo = currentDemoMode !== null ? currentDemoMode :
        (process.env.DEMO_MODE === 'true') || (process.env.DEMO === 'true') || (process.env.NODE_ENV === 'demo');
      if (instance === null || currentDemoMode !== isDemo) {
        console.log('kucoinService: mode changed or instance not initialized, recreating instance, demo=', isDemo);
        instance = createInstance(isDemo);
        currentDemoMode = isDemo;
      } else {
        console.log('kucoinService: returning existing instance, demo=', currentDemoMode);
      }
      return instance;
    },

    setDemoMode: (isDemo: boolean) => {
      console.log('kucoinService: setting demo mode to', isDemo);
      instance = createInstance(isDemo);
      currentDemoMode = isDemo;
    }
  };
})();