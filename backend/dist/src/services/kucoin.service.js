import ccxt from 'ccxt';
export class KuCoinService {
    exchange;
    hasCredentials;
    id;
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
    async getBalance() {
        if (!this.hasCredentials) {
            console.warn('No KuCoin credentials provided, returning empty balance');
            return {};
        }
        try {
            return await this.exchange.fetchBalance();
        }
        catch (error) {
            console.error('Error fetching balance:', error);
            throw error;
        }
    }
    async getTicker(symbol) {
        try {
            return await this.exchange.fetchTicker(symbol);
        }
        catch (error) {
            console.error('Error fetching ticker:', error);
            throw error;
        }
    }
    async getOrderBook(symbol, limit = 20) {
        try {
            return await this.exchange.fetchOrderBook(symbol, limit);
        }
        catch (error) {
            console.error('Error fetching order book:', error);
            throw error;
        }
    }
    async createOrder(symbol, type, side, amount, price) {
        if (!this.hasCredentials) {
            throw new Error('KuCoin credentials are required to create orders');
        }
        try {
            return await this.exchange.createOrder(symbol, type, side, amount, price);
        }
        catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    }
    async placeOrder(symbol, side, amount) {
        return await this.createOrder(symbol, 'market', side, amount);
    }
    async getHistoricalData(symbol, timeframe = '1h', limit = 100) {
        try {
            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 10000));
            const fetchPromise = this.exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
            const ohlcv = await Promise.race([fetchPromise, timeoutPromise]);
            return ohlcv.map((candle) => ({
                timestamp: candle[0],
                open: candle[1],
                high: candle[2],
                low: candle[3],
                close: candle[4],
                volume: candle[5]
            }));
        }
        catch (error) {
            console.error('Error fetching historical data:', error);
            // Return empty array to continue without data
            return [];
        }
    }
    async getOpenOrders(symbol) {
        console.log('getOpenOrders: id =', this.id, 'hasCredentials =', this.hasCredentials);
        if (!this.hasCredentials) {
            console.warn('No KuCoin credentials provided, returning empty orders');
            return [];
        }
        try {
            return await this.exchange.fetchOpenOrders(symbol);
        }
        catch (error) {
            console.error('Error fetching open orders:', error);
            throw error;
        }
    }
    async cancelOrder(orderId, symbol) {
        if (!this.hasCredentials) {
            throw new Error('KuCoin credentials are required to cancel orders');
        }
        try {
            return await this.exchange.cancelOrder(orderId, symbol);
        }
        catch (error) {
            console.error('Error canceling order:', error);
            throw error;
        }
    }
    async getOrderHistory(symbol, limit = 50) {
        if (!this.hasCredentials) {
            console.warn('No KuCoin credentials provided, returning empty order history');
            return [];
        }
        try {
            return await this.exchange.fetchClosedOrders(symbol, undefined, limit);
        }
        catch (error) {
            console.error('Error fetching order history:', error);
            throw error;
        }
    }
    async getTrades(symbol, limit = 50) {
        if (!this.hasCredentials) {
            console.warn('No KuCoin credentials provided, returning empty trades');
            return [];
        }
        try {
            return await this.exchange.fetchMyTrades(symbol, undefined, limit);
        }
        catch (error) {
            console.error('Error fetching trades:', error);
            throw error;
        }
    }
    async getMarkets() {
        try {
            return await this.exchange.loadMarkets();
        }
        catch (error) {
            console.error('Error loading markets:', error);
            throw error;
        }
    }
}
export const kucoinService = (() => {
    let instance = null;
    return () => {
        console.log('kucoinService called, instance exists:', !!instance);
        if (!instance) {
            console.log('Creating new instance');
            instance = new KuCoinService();
        }
        else {
            // id is a private property; log with a cast to any to avoid TS error
            console.log('Returning existing instance', instance.id);
        }
        return instance;
    };
})();
//# sourceMappingURL=kucoin.service.js.map