import { BaseStrategy, OHLCVData, StrategyConfig, Signal } from './base.strategy';
export interface EmaMlConfig extends StrategyConfig {
    fastPeriod: number;
    slowPeriod: number;
    emaThreshold: number;
    mlBuyThreshold: number;
    mlSellThreshold: number;
    takeProfitPercent: number;
    stopLossPercent: number;
    trailingStop: boolean;
    minHoldTime: number;
}
export declare class EmaMlStrategy extends BaseStrategy {
    private mlPredictor;
    private trailingStopPrice;
    private lastSignal;
    private entryPrice;
    private entryTime;
    constructor(config: EmaMlConfig);
    calculateSignal(data: OHLCVData[]): Signal;
    getName(): string;
    private resetPosition;
}
//# sourceMappingURL=ema-ml.strategy.d.ts.map