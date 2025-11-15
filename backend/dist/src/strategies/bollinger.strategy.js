import { BaseStrategy } from './base.strategy';
import { calculateBollingerBands } from '../indicators/bollinger';
export class BollingerBandsStrategy extends BaseStrategy {
    lastSignal = 'hold';
    entryPrice = 0;
    constructor(config) {
        super(config);
    }
    getName() {
        return 'Bollinger Bands Strategy';
    }
    calculateSignal(data) {
        if (data.length < this.config.period)
            return 'hold';
        const closes = data.map(d => d.close);
        const currentPrice = closes[closes.length - 1];
        const config = this.config;
        const { upper, lower } = calculateBollingerBands(closes, config.period, config.multiplier);
        if (upper.length === 0 || lower.length === 0)
            return 'hold';
        const upperBand = upper[upper.length - 1];
        const lowerBand = lower[lower.length - 1];
        // Check take profit / stop loss first
        if (this.lastSignal === 'buy' && this.entryPrice > 0) {
            const profitPercent = (currentPrice - this.entryPrice) / this.entryPrice * 100;
            if (profitPercent >= config.takeProfitPercent + 2 * config.commissionPercent) {
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
        // Buy signal
        if (currentPrice < lowerBand && this.lastSignal !== 'buy') {
            this.lastSignal = 'buy';
            this.entryPrice = currentPrice;
            return 'buy';
        }
        return 'hold';
    }
}
//# sourceMappingURL=bollinger.strategy.js.map