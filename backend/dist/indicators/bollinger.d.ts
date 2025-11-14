export interface BollingerBandsResult {
    upper: number[];
    middle: number[];
    lower: number[];
}
export declare function calculateBollingerBands(prices: number[], period?: number, stdDev?: number): BollingerBandsResult;
//# sourceMappingURL=bollinger.d.ts.map