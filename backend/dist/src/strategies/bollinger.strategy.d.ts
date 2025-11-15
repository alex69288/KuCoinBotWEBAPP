import { BaseStrategy, OHLCVData, StrategyConfig, Signal } from './base.strategy';
export interface BollingerBandsConfig extends StrategyConfig {
    period: number;
    multiplier: number;
    takeProfitPercent: number;
    stopLossPercent: number;
}
export declare class BollingerBandsStrategy extends BaseStrategy {
    private lastSignal;
    private entryPrice;
    constructor(config: BollingerBandsConfig);
    getName(): string;
    calculateSignal(data: OHLCVData[]): Signal;
}
//# sourceMappingURL=bollinger.strategy.d.ts.map