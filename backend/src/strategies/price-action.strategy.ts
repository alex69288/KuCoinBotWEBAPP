import { BaseStrategy, OHLCVData, StrategyConfig, Signal } from './base.strategy';

export interface PriceActionConfig extends StrategyConfig {
  lookbackPeriod: number; // Период для поиска уровней (в свечах)
  breakoutThreshold: number; // Порог пробоя в %
  minVolume: number; // Минимальный объем для паттерна
  useSupportResistance: boolean; // Использовать уровни поддержки/сопротивления
  useCandlestickPatterns: boolean; // Использовать свечные паттерны
  takeProfitPercent: number;
  stopLossPercent: number;
}

export class PriceActionStrategy extends BaseStrategy {
  private supportLevels: number[] = [];
  private resistanceLevels: number[] = [];
  private lastSignal: Signal = 'hold';
  private entryPrice: number = 0;

  constructor(config: PriceActionConfig) {
    super(config);
  }

  getName(): string {
    return 'Price Action Strategy';
  }

  private findSupportResistance(data: OHLCVData[]): void {
    const config = this.config as PriceActionConfig;
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);

    // Поиск локальных максимумов и минимумов
    const localHighs: number[] = [];
    const localLows: number[] = [];

    for (let i = config.lookbackPeriod; i < highs.length - config.lookbackPeriod; i++) {
      // Локальный максимум
      let isLocalHigh = true;
      for (let j = i - config.lookbackPeriod; j <= i + config.lookbackPeriod; j++) {
        if (j !== i && highs[j] >= highs[i]) {
          isLocalHigh = false;
          break;
        }
      }
      if (isLocalHigh) {
        localHighs.push(highs[i]);
      }

      // Локальный минимум
      let isLocalLow = true;
      for (let j = i - config.lookbackPeriod; j <= i + config.lookbackPeriod; j++) {
        if (j !== i && lows[j] <= lows[i]) {
          isLocalLow = false;
          break;
        }
      }
      if (isLocalLow) {
        localLows.push(lows[i]);
      }
    }

    // Группировка близких уровней (кластеризация)
    this.resistanceLevels = this.clusterLevels(localHighs, 0.005); // 0.5% tolerance
    this.supportLevels = this.clusterLevels(localLows, 0.005);
  }

  private clusterLevels(levels: number[], tolerance: number): number[] {
    if (levels.length === 0) return [];

    const clusters: number[] = [];
    const sortedLevels = [...levels].sort((a, b) => a - b);

    let currentCluster = [sortedLevels[0]];

    for (let i = 1; i < sortedLevels.length; i++) {
      const level = sortedLevels[i];
      const clusterAvg = currentCluster.reduce((sum, l) => sum + l, 0) / currentCluster.length;

      if (Math.abs(level - clusterAvg) / clusterAvg <= tolerance) {
        currentCluster.push(level);
      } else {
        clusters.push(currentCluster.reduce((sum, l) => sum + l, 0) / currentCluster.length);
        currentCluster = [level];
      }
    }

    if (currentCluster.length > 0) {
      clusters.push(currentCluster.reduce((sum, l) => sum + l, 0) / currentCluster.length);
    }

    return clusters;
  }

  private detectCandlestickPatterns(data: OHLCVData[]): { pattern: string; strength: number } | null {
    if (data.length < 3) return null;

    const current = data[data.length - 1];
    const previous = data[data.length - 2];
    const beforePrevious = data[data.length - 3];

    const body = Math.abs(current.close - current.open);
    const upperWick = current.high - Math.max(current.open, current.close);
    const lowerWick = Math.min(current.open, current.close) - current.low;
    const totalRange = current.high - current.low;

    // Пин-бар (Pin Bar)
    if (lowerWick > body * 2 && upperWick < body * 0.5 && current.close > current.open) {
      return { pattern: 'bullish_pin', strength: 0.8 };
    }
    if (upperWick > body * 2 && lowerWick < body * 0.5 && current.close < current.open) {
      return { pattern: 'bearish_pin', strength: 0.8 };
    }

    // Engulfing паттерн
    const prevBody = Math.abs(previous.close - previous.open);
    const isBullishEngulfing = current.close > current.open &&
      current.open < previous.close &&
      current.close > previous.open &&
      body > prevBody * 1.1;

    const isBearishEngulfing = current.close < current.open &&
      current.open > previous.close &&
      current.close < previous.open &&
      body > prevBody * 1.1;

    if (isBullishEngulfing) {
      return { pattern: 'bullish_engulfing', strength: 0.9 };
    }
    if (isBearishEngulfing) {
      return { pattern: 'bearish_engulfing', strength: 0.9 };
    }

    // Inside Bar
    if (current.high <= previous.high && current.low >= previous.low) {
      const direction = current.close > previous.close ? 'bullish' : 'bearish';
      return { pattern: `${direction}_inside_bar`, strength: 0.6 };
    }

    return null;
  }

  private checkBreakout(currentPrice: number, levels: number[], threshold: number): boolean {
    for (const level of levels) {
      const breakoutPercent = Math.abs(currentPrice - level) / level;
      if (breakoutPercent <= threshold) {
        return true;
      }
    }
    return false;
  }

  calculateSignal(data: OHLCVData[]): Signal {
    if (data.length < (this.config as PriceActionConfig).lookbackPeriod) return 'hold';

    this.findSupportResistance(data);

    const currentCandle = data[data.length - 1];
    const config = this.config as PriceActionConfig;

    // Проверка на пробой уровня сопротивления
    for (const resistance of this.resistanceLevels) {
      if (currentCandle.close > resistance * (1 + config.breakoutThreshold / 100)) {
        this.lastSignal = 'buy';
        this.entryPrice = currentCandle.close;
        return 'buy';
      }
    }

    // Проверка на пробой уровня поддержки
    for (const support of this.supportLevels) {
      if (currentCandle.close < support * (1 - config.breakoutThreshold / 100)) {
        this.lastSignal = 'sell';
        this.entryPrice = currentCandle.close;
        return 'sell';
      }
    }

    // Анализ свечных паттернов (если включено)
    if (config.useCandlestickPatterns) {
      const pattern = this.detectCandlestickPatterns(data);
      if (pattern && pattern.strength > 0.8) {
        return pattern.pattern === 'bullish' ? 'buy' : 'sell';
      }
    }

    return 'hold';
  }

  getStatus(): any {
    return {
      name: this.getName(),
      lastSignal: this.lastSignal,
      entryPrice: this.entryPrice,
      supportLevels: this.supportLevels,
      resistanceLevels: this.resistanceLevels,
      config: this.config
    };
  }
}