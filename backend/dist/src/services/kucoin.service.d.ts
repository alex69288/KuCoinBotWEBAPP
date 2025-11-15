export declare class KuCoinService {
    private exchange;
    private hasCredentials;
    constructor();
    getBalance(): Promise<any>;
    getTicker(symbol: string): Promise<any>;
    getOrderBook(symbol: string, limit?: number): Promise<any>;
    createOrder(symbol: string, type: 'limit' | 'market', side: 'buy' | 'sell', amount: number, price?: number): Promise<any>;
    placeOrder(symbol: string, side: 'buy' | 'sell', amount: number): Promise<any>;
    getHistoricalData(symbol: string, timeframe?: string, limit?: number): Promise<any[]>;
    getOpenOrders(symbol?: string): Promise<any[]>;
    cancelOrder(orderId: string, symbol?: string): Promise<any>;
    getOrderHistory(symbol?: string, limit?: number): Promise<any[]>;
    getTrades(symbol?: string, limit?: number): Promise<any[]>;
    getMarkets(): Promise<any[]>;
}
export declare const kucoinService: () => KuCoinService;
//# sourceMappingURL=kucoin.service.d.ts.map