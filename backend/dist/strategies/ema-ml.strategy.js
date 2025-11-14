import { BaseStrategy } from './base.strategy.js';
import { calculateEMA } from '../indicators/ema.js';
import { SimpleMLPredictor } from '../ml/predictor.js';
export class EmaMlStrategy extends BaseStrategy {
    mlPredictor;
    lastSignal = 'hold';
    entryPrice = 0;
    entryTime = 0;
    constructor(config) {
        super(config);
        this.mlPredictor = new SimpleMLPredictor();
    }
    calculateSignal(data) {
        if (data.length < 50)
            return 'hold';
        const closes = data.map(d => d.close);
        const currentPrice = closes[closes.length - 1];
        const currentTime = data[data.length - 1].timestamp;
        // Calculate EMAs
        const emaFast = calculateEMA(closes, this.config.fastPeriod);
        const emaSlow = calculateEMA(closes, this.config.slowPeriod);
        if (emaFast.length === 0 || emaSlow.length === 0)
            return 'hold';
        const fastEMA = emaFast[emaFast.length - 1];
        const slowEMA = emaSlow[emaSlow.length - 1];
        const emaDiff = (fastEMA - slowEMA) / slowEMA * 100; // percentage difference
        // Get ML prediction
        const mlConfidence = this.mlPredictor.predict(data);
        // Check take profit / stop loss
        if (this.lastSignal === 'buy' && this.entryPrice > 0) {
            const profitPercent = (currentPrice - this.entryPrice) / this.entryPrice * 100;
            // Take profit
            if (profitPercent >= this.config.takeProfitPercent) {
                this.resetPosition();
                return 'sell';
            }
            // Stop loss
            if (profitPercent <= -this.config.stopLossPercent) {
                this.resetPosition();
                return 'sell';
            }
            // Min hold time
            const holdTime = (currentTime - this.entryTime) / (1000 * 60); // minutes
            if (holdTime < this.config.minHoldTime) {
                return 'hold';
            }
        }
        // Buy signal
        if (emaDiff > this.config.emaThreshold &&
            mlConfidence > this.config.mlBuyThreshold &&
            this.lastSignal !== 'buy') {
            this.lastSignal = 'buy';
            this.entryPrice = currentPrice;
            this.entryTime = currentTime;
            return 'buy';
        }
        // Sell signal (if in position and conditions changed)
        if (this.lastSignal === 'buy' &&
            (emaDiff < -this.config.emaThreshold ||
                mlConfidence < this.config.mlSellThreshold)) {
            this.resetPosition();
            return 'sell';
        }
        return 'hold';
    }
    getName() {
        return 'EMA + ML Strategy';
    }
    resetPosition() {
        this.lastSignal = 'hold';
        this.entryPrice = 0;
        this.entryTime = 0;
    }
}
//# sourceMappingURL=ema-ml.strategy.js.map