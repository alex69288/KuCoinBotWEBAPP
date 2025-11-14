export interface MACDResult {
    macd: number[];
    signal: number[];
    histogram: number[];
}
export declare function calculateMACD(prices: number[], fastPeriod?: number, slowPeriod?: number, signalPeriod?: number): MACDResult;
//# sourceMappingURL=macd.d.ts.map