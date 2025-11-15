import { BaseStrategy, OHLCVData, StrategyConfig, Signal } from './base.strategy';
export interface MacdRsiConfig extends StrategyConfig {
    rsiPeriod: number;
    rsiOverbought: number;
    rsiOversold: number;
    macdFast: number;
    macdSlow: number;
    macdSignal: number;
    takeProfitPercent: number;
    stopLossPercent: number;
    useMacdCrossover: boolean;
    useRsiFilter: boolean;
}
export declare class MacdRsiStrategy extends BaseStrategy {
    private lastSignal;
    private entryPrice;
    constructor(config: MacdRsiConfig);
    getName(): string;
    calculateSignal(data: OHLCVData[]): Signal;
    getStatus(): any;
}
//# sourceMappingURL=macd-rsi.strategy.d.ts.map