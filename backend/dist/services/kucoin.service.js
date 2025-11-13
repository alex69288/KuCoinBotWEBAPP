"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.kucoinService = exports.KuCoinService = void 0;
const ccxt_1 = __importDefault(require("ccxt"));
class KuCoinService {
    constructor() {
        this.exchange = new ccxt_1.default.kucoin({
            apiKey: process.env.KUCOIN_API_KEY,
            secret: process.env.KUCOIN_API_SECRET,
            password: process.env.KUCOIN_API_PASSPHRASE,
            sandbox: !process.env.KUCOIN_API_KEY, // Use sandbox if no API key
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
exports.KuCoinService = KuCoinService;
exports.kucoinService = new KuCoinService();
//# sourceMappingURL=kucoin.service.js.map