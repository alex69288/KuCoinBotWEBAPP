export declare class KuCoinService {
    private exchange;
    constructor();
    getBalance(): Promise<any>;
    getTicker(symbol: string): Promise<any>;
    getOrderBook(symbol: string, limit?: number): Promise<any>;
    createOrder(symbol: string, type: 'limit' | 'market', side: 'buy' | 'sell', amount: number, price?: number): Promise<any>;
    getOpenOrders(symbol?: string): Promise<any[]>;
    cancelOrder(orderId: string, symbol?: string): Promise<any>;
    getMarkets(): Promise<any[]>;
}
export declare const kucoinService: KuCoinService;
//# sourceMappingURL=kucoin.service.d.ts.map