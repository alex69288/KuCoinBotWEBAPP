interface BotConfig {
    enabled: boolean;
    demoMode: boolean;
    maxDailyLoss: number;
    maxConsecutiveLosses: number;
    positionSizePercent: number;
    telegramToken: string;
    telegramChatId: string;
    symbols: string[];
    strategy: 'ema-ml' | 'price-action' | 'macd-rsi' | 'bollinger';
    strategyConfig: any;
}
export declare class KuCoinBot {
    private kucoinService;
    private config;
    private isRunning;
    private positions;
    private dailyStats;
    private riskManager;
    private strategy;
    private marketData;
    constructor(config: BotConfig);
    private initializeStrategy;
    private updateMarketData;
    private calculatePositionSize;
    start(): Promise<void>;
    stop(): Promise<void>;
    private runMainLoop;
    private checkRiskLimits;
    executeTrade(symbol: string, side: 'buy' | 'sell', amount: number, price?: number): Promise<void>;
    getStatus(): any;
    updateConfig(newConfig: Partial<BotConfig>): void;
}
export {};
//# sourceMappingURL=bot.d.ts.map