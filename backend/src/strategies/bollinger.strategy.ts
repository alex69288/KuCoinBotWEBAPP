import { BaseStrategy, OHLCVData, StrategyConfig, Signal } from './base.strategy';
import { calculateBollingerBands } from '../indicators/bollinger';

export interface BollingerBandsConfig extends StrategyConfig {
  period: number; // Период для расчета полос Боллинджера
  multiplier: number; // Множитель для стандартного отклонения
  takeProfitPercent: number;
  stopLossPercent: number;
}

export class BollingerBandsStrategy extends BaseStrategy {
  private lastSignal: Signal = 'hold';
  private entryPrice: number = 0;

  constructor(config: BollingerBandsConfig) {
    super(config);
  }

  getName(): string {
    return 'Bollinger Bands Strategy';
  }

  calculateSignal(data: OHLCVData[]): Signal {
    if (data.length < (this.config as BollingerBandsConfig).period) return 'hold';

    const closes = data.map(d => d.close);
    const currentPrice = closes[closes.length - 1];

    const config = this.config as BollingerBandsConfig;
    const { upper, lower } = calculateBollingerBands(closes, config.period, config.multiplier);

    if (upper.length === 0 || lower.length === 0) return 'hold';

    const upperBand = upper[upper.length - 1];
    const lowerBand = lower[lower.length - 1];

    if (currentPrice > upperBand) {
      this.lastSignal = 'sell';
      this.entryPrice = currentPrice;
      return 'sell';
    } else if (currentPrice < lowerBand) {
      this.lastSignal = 'buy';
      this.entryPrice = currentPrice;
      return 'buy';
    }

    return 'hold';
  }
}