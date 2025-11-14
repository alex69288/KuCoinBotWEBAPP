export function calculateBollingerBands(prices, period = 20, stdDev = 2) {
    if (prices.length < period)
        return { upper: [], middle: [], lower: [] };
    const upper = [];
    const middle = [];
    const lower = [];
    for (let i = period - 1; i < prices.length; i++) {
        const slice = prices.slice(i - period + 1, i + 1);
        const sma = slice.reduce((sum, price) => sum + price, 0) / period;
        middle.push(sma);
        const variance = slice.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
        const standardDeviation = Math.sqrt(variance);
        upper.push(sma + stdDev * standardDeviation);
        lower.push(sma - stdDev * standardDeviation);
    }
    return { upper, middle, lower };
}
//# sourceMappingURL=bollinger.js.map