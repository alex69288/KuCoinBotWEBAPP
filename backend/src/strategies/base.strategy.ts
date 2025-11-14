export interface OHLCVData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StrategyConfig {
  symbol: string;
  [key: string]: any;
}

export type Signal = 'buy' | 'sell' | 'hold';

export abstract class BaseStrategy {
  protected config: StrategyConfig;

  constructor(config: StrategyConfig) {
    this.config = config;
  }

  abstract calculateSignal(data: OHLCVData[]): Signal;

  abstract getName(): string;

  updateConfig(newConfig: Partial<StrategyConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): StrategyConfig {
    return this.config;
  }
}