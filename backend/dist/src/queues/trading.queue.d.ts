interface TradeJobData {
    symbol: string;
    type: 'limit' | 'market';
    side: 'buy' | 'sell';
    amount: number;
    price?: number;
    userId: string;
}
declare let tradingQueue: any;
export declare const addTradeJob: (data: TradeJobData) => any;
export declare const getQueueStatus: () => Promise<{
    waiting: any;
    active: any;
    completed: any;
    failed: any;
}>;
export default tradingQueue;
//# sourceMappingURL=trading.queue.d.ts.map