import { BaseStrategy } from './base.strategy';
import { calculateRSI } from '../indicators/rsi';
import { calculateMACD } from '../indicators/macd';
export class MacdRsiStrategy extends BaseStrategy {
    lastSignal = 'hold';
    entryPrice = 0;
    constructor(config) {
        super(config);
    }
    getName() {
        return 'MACD + RSI Strategy';
    }
    calculateSignal(data) {
        if (data.length < 50)
            return 'hold';
        const closes = data.map(d => d.close);
        const currentPrice = closes[closes.length - 1];
        const config = this.config;
        // Calculate RSI
        const rsi = calculateRSI(closes, config.rsiPeriod);
        if (rsi.length === 0)
            return 'hold';
        const currentRSI = rsi[rsi.length - 1];
        const prevRSI = rsi.length > 1 ? rsi[rsi.length - 2] : currentRSI;
        // Calculate MACD
        const macd = calculateMACD(closes, config.macdFast, config.macdSlow, config.macdSignal);
        if (macd.macd.length === 0 || macd.signal.length === 0 || macd.histogram.length === 0) {
            return 'hold';
        }
        const currentMACD = macd.macd[macd.macd.length - 1];
        const currentSignal = macd.signal[macd.signal.length - 1];
        const currentHistogram = macd.histogram[macd.histogram.length - 1];
        const prevHistogram = macd.histogram.length > 1 ? macd.histogram[macd.histogram.length - 2] : 0;
        // Check take profit / stop loss first
        if (this.lastSignal === 'buy' && this.entryPrice > 0) {
            const profitPercent = (currentPrice - this.entryPrice) / this.entryPrice * 100;
            if (profitPercent >= config.takeProfitPercent) {
                this.lastSignal = 'hold';
                this.entryPrice = 0;
                return 'sell';
            }
            if (profitPercent <= -config.stopLossPercent) {
                this.lastSignal = 'hold';
                this.entryPrice = 0;
                return 'sell';
            }
        }
        // Generate buy/sell signals
        let buySignal = false;
        let sellSignal = false;
        // RSI signals
        const rsiOversold = currentRSI <= config.rsiOversold;
        const rsiOverbought = currentRSI >= config.rsiOverbought;
        // MACD signals
        const macdBullish = currentMACD > currentSignal; // MACD above signal line
        const macdBearish = currentMACD < currentSignal; // MACD below signal line
        const histogramPositive = currentHistogram > 0;
        const histogramGrowing = currentHistogram > prevHistogram;
        if (config.useMacdCrossover) {
            // MACD crossover strategy
            if (macdBullish && histogramPositive) {
                buySignal = true;
            }
            if (macdBearish && !histogramPositive) {
                sellSignal = true;
            }
        }
        else {
            // MACD histogram strategy
            if (histogramGrowing && histogramPositive) {
                buySignal = true;
            }
            if (!histogramGrowing && !histogramPositive) {
                sellSignal = true;
            }
        }
        // Apply RSI filter if enabled
        if (config.useRsiFilter) {
            buySignal = buySignal && rsiOversold;
            sellSignal = sellSignal && rsiOverbought;
        }
        // Generate final signal
        if (buySignal && this.lastSignal !== 'buy') {
            this.lastSignal = 'buy';
            this.entryPrice = currentPrice;
            return 'buy';
        }
        if (sellSignal && this.lastSignal === 'buy') {
            this.lastSignal = 'hold';
            this.entryPrice = 0;
            return 'sell';
        }
        return 'hold';
    }
    getStatus() {
        return {
            name: 'MACD + RSI Strategy',
            lastSignal: this.lastSignal,
            entryPrice: this.entryPrice,
            config: this.config
        };
    }
}
//# sourceMappingURL=macd-rsi.strategy.js.map