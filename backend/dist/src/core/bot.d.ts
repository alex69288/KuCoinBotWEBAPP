import { EmaMlConfig } from '../strategies/ema-ml.strategy';
import { MacdRsiConfig } from '../strategies/macd-rsi.strategy';
import { PriceActionConfig } from '../strategies/price-action.strategy';
import { BollingerBandsConfig } from '../strategies/bollinger.strategy';
interface BotConfig {
    enabled: boolean;
    demoMode: boolean;
    maxDailyLoss: number;
    maxConsecutiveLosses: number;
    positionSizePercent: number;
    volatilityLimit: number;
    minOrderAmount: number;
    telegramToken: string;
    telegramChatId: string;
    symbols: string[];
    strategy: 'ema-ml' | 'price-action' | 'macd-rsi' | 'bollinger';
    strategyConfig: EmaMlConfig | PriceActionConfig | MacdRsiConfig | BollingerBandsConfig;
}
/**
 * Represents a single trade.
 */
export interface Trade {
    id: string;
    symbol: string;
    side: 'buy' | 'sell';
    amount: number;
    profit: number;
    timestamp: Date;
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
    private static instance;
    private demoTrades;
    constructor(config: BotConfig);
    static getInstance(config?: BotConfig): KuCoinBot;
    private initializeStrategy;
    private updateMarketData;
    private calculatePositionSize;
    private checkRiskLimits;
    private calculateVolatility;
    private simulateTrade;
    getDemoTrades(): Array<{
        symbol: string;
        side: 'buy' | 'sell';
        amount: number;
        price: number;
        timestamp: number;
    }>;
    clearDemoTrades(): void;
    private executeTrade;
    private recordTrade;
    start(): Promise<void>;
    stop(): Promise<void>;
    private runMainLoop;
    private trainMLModel;
    private calculateTradeProfit;
    private logTradingMetrics;
    getStatus(): any;
    getConfig(): BotConfig;
    getStats(): any;
    manualTrade(symbol: string, side: 'buy' | 'sell', amount: number, type?: 'market' | 'limit', price?: number): Promise<any>;
    updateConfig(newConfig: Partial<BotConfig>): void;
    setDemoMode(enabled: boolean): void;
}
export {};
//# sourceMappingURL=bot.d.ts.map