export interface OHLCVData {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
export interface StrategyConfig {
    symbol: string;
    [key: string]: any;
}
export type Signal = 'buy' | 'sell' | 'hold';
export declare abstract class BaseStrategy {
    protected config: StrategyConfig;
    constructor(config: StrategyConfig);
    abstract calculateSignal(data: OHLCVData[]): Signal;
    abstract getName(): string;
    updateConfig(newConfig: Partial<StrategyConfig>): void;
    getConfig(): StrategyConfig;
}
//# sourceMappingURL=base.strategy.d.ts.map