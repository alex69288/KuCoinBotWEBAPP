import { BaseStrategy, OHLCVData, StrategyConfig, Signal } from './base.strategy';
import { calculateEMA } from '../indicators/ema';
import { RandomForestPredictor } from '../ml/random_forest';

export interface EmaMlConfig extends StrategyConfig {
  fastPeriod: number;
  slowPeriod: number;
  emaThreshold: number;
  mlBuyThreshold: number;
  mlSellThreshold: number;
  takeProfitPercent: number;
  stopLossPercent: number;
  commissionPercent: number;
  trailingStop: boolean;
  minHoldTime: number; // in minutes
}

export class EmaMlStrategy extends BaseStrategy {
  private mlPredictor: RandomForestPredictor;
  private trailingStopPrice: number | null = null; // For Trailing Stop
  private lastSignal: Signal = 'hold';
  private entryPrice: number = 0;
  private entryTime: number = 0;

  constructor(config: EmaMlConfig) {
    super(config);
    this.mlPredictor = new RandomForestPredictor();
  }

  calculateSignal(data: OHLCVData[]): Signal {
    if (data.length < 50) return 'hold';

    const closes = data.map(d => d.close);
    const currentPrice = closes[closes.length - 1];
    const currentTime = data[data.length - 1].timestamp;

    // Calculate EMAs
    const emaFast = calculateEMA(closes, (this.config as EmaMlConfig).fastPeriod);
    const emaSlow = calculateEMA(closes, (this.config as EmaMlConfig).slowPeriod);

    if (emaFast.length === 0 || emaSlow.length === 0) return 'hold';

    const fastEMA = emaFast[emaFast.length - 1];
    const slowEMA = emaSlow[emaSlow.length - 1];
    const emaDiff = (fastEMA - slowEMA) / slowEMA * 100; // percentage difference

    // Get ML prediction
    const mlConfidence = this.mlPredictor.predict(data);

    // Check take profit / stop loss / trailing stop
    if (this.lastSignal === 'buy' && this.entryPrice > 0) {
      const profitPercent = (currentPrice - this.entryPrice) / this.entryPrice * 100;

      // Take profit
      if (profitPercent >= (this.config as EmaMlConfig).takeProfitPercent + 2 * (this.config as EmaMlConfig).commissionPercent) {
        this.resetPosition();
        return 'sell';
      }

      // Stop loss
      if (profitPercent <= -(this.config as EmaMlConfig).stopLossPercent) {
        this.resetPosition();
        return 'sell';
      }

      // Trailing stop
      if ((this.config as EmaMlConfig).trailingStop) {
        if (this.trailingStopPrice === null || currentPrice > this.trailingStopPrice) {
          this.trailingStopPrice = currentPrice * (1 - (this.config as EmaMlConfig).stopLossPercent / 100);
        } else if (currentPrice < this.trailingStopPrice) {
          this.resetPosition();
          return 'sell';
        }
      }

      // Min hold time
      const holdTime = (currentTime - this.entryTime) / (1000 * 60); // minutes
      if (holdTime < (this.config as EmaMlConfig).minHoldTime) {
        return 'hold';
      }
    }

    // Buy signal
    if (emaDiff > (this.config as EmaMlConfig).emaThreshold &&
      mlConfidence > (this.config as EmaMlConfig).mlBuyThreshold &&
      this.lastSignal !== 'buy') {
      this.lastSignal = 'buy';
      this.entryPrice = currentPrice;
      this.entryTime = currentTime;
      this.trailingStopPrice = null; // Reset trailing stop
      return 'buy';
    }

    return 'hold';
  }

  getName(): string {
    return 'EMA + ML Strategy';
  }

  private resetPosition(): void {
    this.lastSignal = 'hold';
    this.entryPrice = 0;
    this.entryTime = 0;
    this.trailingStopPrice = null;
  }
}