/**
 * Реальный KuCoin сервис (использует ccxt)
 */
export declare class KuCoinService {
    private exchange;
    protected hasCredentials: boolean;
    id: string | number;
    isDemoMode: boolean;
    constructor();
    isDemo: boolean;
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
    setDemoSeedPrices(_prices: Record<string, number>): void;
}
/**
 * Demo implementation: полностью эмулирует поведение биржи в памяти.
 */
export declare class DemoKuCoinService extends KuCoinService {
    protected hasCredentials: boolean;
    private balances;
    private prices;
    private openOrders;
    private trades;
    private markets;
    constructor();
    isDemo: true;
    getBalance(): Promise<any>;
    private nowPrice;
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
    setDemoSeedPrices(prices: Record<string, number>): void;
}
export declare const kucoinService: {
    getInstance: () => KuCoinService | DemoKuCoinService;
    setDemoMode: (isDemo: boolean) => void;
};
//# sourceMappingURL=kucoin.service.d.ts.map