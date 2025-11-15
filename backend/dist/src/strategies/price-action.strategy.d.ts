import { BaseStrategy, OHLCVData, StrategyConfig, Signal } from './base.strategy';
export interface PriceActionConfig extends StrategyConfig {
    lookbackPeriod: number;
    breakoutThreshold: number;
    minVolume: number;
    useSupportResistance: boolean;
    useCandlestickPatterns: boolean;
    takeProfitPercent: number;
    stopLossPercent: number;
}
export declare class PriceActionStrategy extends BaseStrategy {
    private supportLevels;
    private resistanceLevels;
    private lastSignal;
    private entryPrice;
    constructor(config: PriceActionConfig);
    getName(): string;
    private findSupportResistance;
    private clusterLevels;
    private detectCandlestickPatterns;
    private checkBreakout;
    calculateSignal(data: OHLCVData[]): Signal;
    getStatus(): any;
}
//# sourceMappingURL=price-action.strategy.d.ts.map