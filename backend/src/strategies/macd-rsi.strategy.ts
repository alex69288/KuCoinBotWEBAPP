import { BaseStrategy, OHLCVData, StrategyConfig, Signal } from './base.strategy';
import { calculateRSI } from '../indicators/rsi';
import { calculateMACD } from '../indicators/macd';

export interface MacdRsiConfig extends StrategyConfig {
  rsiPeriod: number;
  rsiOverbought: number;
  rsiOversold: number;
  macdFast: number;
  macdSlow: number;
  macdSignal: number;
  takeProfitPercent: number;
  stopLossPercent: number;
  commissionPercent: number;
  useMacdCrossover: boolean;
  useRsiFilter: boolean;
}

export class MacdRsiStrategy extends BaseStrategy {
  private lastSignal: Signal = 'hold';
  private entryPrice: number = 0;

  constructor(config: MacdRsiConfig) {
    super(config);
  }

  getName(): string {
    return 'MACD + RSI Strategy';
  }

  calculateSignal(data: OHLCVData[]): Signal {
    if (data.length < 50) return 'hold';

    const closes = data.map(d => d.close);
    const currentPrice = closes[closes.length - 1];

    const config = this.config as MacdRsiConfig;

    // Calculate RSI
    const rsi = calculateRSI(closes, config.rsiPeriod);
    if (rsi.length === 0) return 'hold';

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

    // Generate buy signal only
    let buySignal = false;

    // RSI signals
    const rsiOversold = currentRSI <= config.rsiOversold;

    // MACD signals
    const macdBullish = currentMACD > currentSignal; // MACD above signal line
    const histogramPositive = currentHistogram > 0;
    const histogramGrowing = currentHistogram > prevHistogram;

    if (config.useMacdCrossover) {
      // MACD crossover strategy
      if (macdBullish && histogramPositive) {
        buySignal = true;
      }
    } else {
      // MACD histogram strategy
      if (histogramGrowing && histogramPositive) {
        buySignal = true;
      }
    }

    // Apply RSI filter if enabled
    if (config.useRsiFilter) {
      buySignal = buySignal && rsiOversold;
    }

    // Generate final signal
    if (buySignal && this.lastSignal !== 'buy') {
      this.lastSignal = 'buy';
      this.entryPrice = currentPrice;
      return 'buy';
    }

    return 'hold';
  }

  getStatus(): any {
    return {
      name: 'MACD + RSI Strategy',
      lastSignal: this.lastSignal,
      entryPrice: this.entryPrice,
      config: this.config
    };
  }
}