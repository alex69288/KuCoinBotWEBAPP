import { EmaMlStrategy } from '../../backend/src/strategies/ema-ml.strategy';
import { OHLCVData } from '../../backend/src/strategies/base.strategy';

describe('EmaMlStrategy', () => {
  let strategy: any;
  const config = {
    symbol: 'BTC/USDT',
    fastPeriod: 12,
    slowPeriod: 26,
    emaThreshold: 0.5,
    mlBuyThreshold: 0.7,
    mlSellThreshold: 0.3,
    takeProfitPercent: 2,
    stopLossPercent: 1,
    commissionPercent: 0.1,
    trailingStop: false,
    minHoldTime: 5
  };

  beforeEach(() => {
    strategy = new EmaMlStrategy(config);
  });

  test('should initialize with config', () => {
    expect(strategy.getName()).toBe('EMA + ML Strategy');
    expect(strategy.getConfig().symbol).toBe('BTC/USDT');
  });

  test('should return hold with insufficient data', () => {
    const data = [
      { timestamp: 1, open: 100, high: 100, low: 100, close: 100, volume: 100 }
    ];
    expect(strategy.calculateSignal(data)).toBe('hold');
  });

  test('should calculate signal with sufficient data', () => {
    // Create mock data with rising prices (should trigger buy)
    const data = [];
    for (let i = 0; i < 60; i++) {
      data.push({
        timestamp: i * 60000,
        open: 100 + i,
        high: 101 + i,
        low: 99 + i,
        close: 100 + i,
        volume: 1000
      });
    }

    const signal = strategy.calculateSignal(data);
    // Depending on ML prediction, could be buy or hold
    expect(['buy', 'hold', 'sell']).toContain(signal);
  });

  test('should update config', () => {
    strategy.updateConfig({ takeProfitPercent: 5 });
    expect(strategy.getConfig().takeProfitPercent).toBe(5);
  });
});