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
    timestamp: number;
}
export declare class KuCoinBot {
    private kucoinService;
    private config;
    private isRunning;
    private positions;
    private demoTrades;
    private dailyStats;
    private riskManager;
    private strategy;
    private marketData;
    private static instance;
    constructor(config: BotConfig);
    static getInstance(config?: BotConfig): KuCoinBot;
    private initializeStrategy;
    private calculatePositionSize;
    private checkRiskLimits;
    private calculateVolatility;
    private simulateTrade;
    private executeTrade;
    private recordTrade;
    private mainLoopInterval;
    start(): Promise<void>;
    stop(): Promise<void>;
    private runMainLoopIteration;
    private updateMarketData;
    private trainMLModel;
    private calculateTradeProfit;
    private logTradingMetrics;
    getStatus(): any;
    getConfig(): BotConfig;
    getStats(): any;
    manualTrade(symbol: string, side: 'buy' | 'sell', amount: number, type?: 'market' | 'limit', price?: number): Promise<any>;
    updateConfig(newConfig: Partial<BotConfig>): void;
    setDemoMode(enabled: boolean): void;
    getDemoTrades(): Trade[];
    clearDemoTrades(): void;
    getMarketUpdate(): Promise<any>;
}
export {};
//# sourceMappingURL=bot.d.ts.map