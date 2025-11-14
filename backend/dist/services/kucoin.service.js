import ccxt from 'ccxt';
export class KuCoinService {
    exchange;
    constructor() {
        this.exchange = new ccxt.kucoin({
            apiKey: process.env.KUCOIN_API_KEY,
            secret: process.env.KUCOIN_API_SECRET,
            password: process.env.KUCOIN_API_PASSPHRASE,
            // KuCoin doesn't support sandbox mode
            // sandbox: !process.env.KUCOIN_API_KEY,
        });
    }
    async getBalance() {
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
        try {
            return await this.exchange.createOrder(symbol, type, side, amount, price);
        }
        catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    }
    async getOpenOrders(symbol) {
        try {
            return await this.exchange.fetchOpenOrders(symbol);
        }
        catch (error) {
            console.error('Error fetching open orders:', error);
            throw error;
        }
    }
    async cancelOrder(orderId, symbol) {
        try {
            return await this.exchange.cancelOrder(orderId, symbol);
        }
        catch (error) {
            console.error('Error canceling order:', error);
            throw error;
        }
    }
    async getOrderHistory(symbol, limit = 50) {
        try {
            return await this.exchange.fetchClosedOrders(symbol, undefined, limit);
        }
        catch (error) {
            console.error('Error fetching order history:', error);
            throw error;
        }
    }
    async getTrades(symbol, limit = 50) {
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
export const kucoinService = new KuCoinService();
//# sourceMappingURL=kucoin.service.js.map