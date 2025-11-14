import { calculateEMA } from './ema';
export function calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    if (prices.length < slowPeriod)
        return { macd: [], signal: [], histogram: [] };
    const fastEMA = calculateEMA(prices, fastPeriod);
    const slowEMA = calculateEMA(prices, slowPeriod);
    // MACD line = fastEMA - slowEMA
    const macd = [];
    const startIndex = slowPeriod - fastPeriod;
    for (let i = 0; i < slowEMA.length; i++) {
        macd.push(fastEMA[i + startIndex] - slowEMA[i]);
    }
    // Signal line = EMA of MACD
    const signal = calculateEMA(macd, signalPeriod);
    // Histogram = MACD - Signal
    const histogram = [];
    const signalStartIndex = signalPeriod - 1;
    for (let i = 0; i < signal.length; i++) {
        histogram.push(macd[i + signalStartIndex] - signal[i]);
    }
    return { macd, signal, histogram };
}
//# sourceMappingURL=macd.js.map