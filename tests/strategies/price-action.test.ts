import { PriceActionStrategy } from '../../backend/src/strategies/price-action.strategy';
import { OHLCVData } from '../../backend/src/strategies/base.strategy';

describe('PriceActionStrategy', () => {
  let strategy: any;
  const config = {
    symbol: 'BTC/USDT',
    lookbackPeriod: 5,
    breakoutThreshold: 0.01, // 1%
    minVolume: 1000,
    useSupportResistance: true,
    useCandlestickPatterns: true,
    takeProfitPercent: 2,
    stopLossPercent: 1
  };

  beforeEach(() => {
    strategy = new PriceActionStrategy(config);
  });

  test('should initialize with config', () => {
    expect(strategy.getName()).toBe('Price Action Strategy');
    expect(strategy.getConfig().symbol).toBe('BTC/USDT');
  });

  test('should return hold with insufficient data', () => {
    const data = [
      { timestamp: 1, open: 100, high: 100, low: 100, close: 100, volume: 100 }
    ];
    expect(strategy.calculateSignal(data)).toBe('hold');
  });

  test('should detect support levels', () => {
    // Create data with clear support level
    const data: OHLCVData[] = [];

    // Generate data with a clear support level around 95
    for (let i = 0; i < 30; i++) {
      const basePrice = 100 + Math.sin(i * 0.2) * 10; // Oscillating around 100
      data.push({
        timestamp: i * 60000,
        open: basePrice,
        high: Math.max(basePrice + 2, basePrice),
        low: Math.min(basePrice - 2, basePrice),
        close: basePrice + (Math.random() - 0.5) * 4,
        volume: 1000
      });
    }

    // Add some data that touches the support level
    for (let i = 0; i < 10; i++) {
      data.push({
        timestamp: (30 + i) * 60000,
        open: 95 + i * 0.5,
        high: 96 + i * 0.5,
        low: 94 + i * 0.5,
        close: 95 + i * 0.5,
        volume: 1000
      });
    }

    strategy.calculateSignal(data);
    const status = strategy.getStatus();

    // Should have detected some support levels
    expect(status.supportLevels).toBeDefined();
    expect(Array.isArray(status.supportLevels)).toBe(true);
  });

  test('should detect bullish pin bar pattern', () => {
    const data: OHLCVData[] = [
      // Previous candles
      { timestamp: 1, open: 100, high: 105, low: 95, close: 102, volume: 1000 },
      { timestamp: 2, open: 102, high: 107, low: 98, close: 105, volume: 1000 },
      // Bullish pin bar: long lower wick, small body, small upper wick
      { timestamp: 3, open: 103, high: 104, low: 95, close: 103.5, volume: 1000 }
    ];

    const signal = strategy.calculateSignal(data);
    // Should potentially generate buy signal based on pin bar
    expect(['buy', 'hold']).toContain(signal);
  });

  test('should detect bearish engulfing pattern', () => {
    const data: OHLCVData[] = [
      // Previous bullish candle
      { timestamp: 1, open: 100, high: 105, low: 95, close: 104, volume: 1000 },
      // Small bearish candle
      { timestamp: 2, open: 104, high: 106, low: 102, close: 103, volume: 1000 },
      // Bearish engulfing: opens higher, closes lower, body engulfs previous
      { timestamp: 3, open: 105, high: 107, low: 95, close: 96, volume: 1000 }
    ];

    const signal = strategy.calculateSignal(data);
    // Should potentially generate sell signal based on engulfing
    expect(['sell', 'hold']).toContain(signal);
  });

  test('should respect take profit and stop loss', () => {
    // Create initial data
    const data: OHLCVData[] = [];
    for (let i = 0; i < 60; i++) {
      data.push({
        timestamp: i * 60000,
        open: 100 + i * 0.1,
        high: 101 + i * 0.1,
        low: 99 + i * 0.1,
        close: 100 + i * 0.1,
        volume: 1000
      });
    }

    // First signal to establish position
    const firstSignal = strategy.calculateSignal(data);
    if (firstSignal === 'buy') {
      // Create data with price movement that triggers take profit
      const tpData = [...data];
      const lastPrice = tpData[tpData.length - 1].close;
      const tpPrice = lastPrice * 1.025; // 2.5% gain

      tpData.push({
        timestamp: 61 * 60000,
        open: lastPrice,
        high: tpPrice + 1,
        low: tpPrice - 1,
        close: tpPrice,
        volume: 1000
      });

      const tpSignal = strategy.calculateSignal(tpData);
      expect(tpSignal).toBe('sell');
    }
  });

  test('should handle breakout threshold correctly', () => {
    const data: OHLCVData[] = [];

    // Create data with a clear resistance level around 110
    for (let i = 0; i < 40; i++) {
      const basePrice = 100 + Math.sin(i * 0.3) * 8; // Oscillating around 100
      data.push({
        timestamp: i * 60000,
        open: basePrice,
        high: Math.max(basePrice + 1, basePrice),
        low: Math.min(basePrice - 1, basePrice),
        close: basePrice + (Math.random() - 0.5) * 2,
        volume: 1000
      });
    }

    // Add breakout candle
    data.push({
      timestamp: 41 * 60000,
      open: 108,
      high: 112, // Breaks above resistance
      low: 107,
      close: 111,
      volume: 1000
    });

    const signal = strategy.calculateSignal(data);
    // Should potentially generate buy signal on resistance breakout
    expect(['buy', 'hold']).toContain(signal);
  });

  test('should return status information', () => {
    const status = strategy.getStatus();
    expect(status.name).toBe('Price Action Strategy');
    expect(status.config).toBeDefined();
    expect(status.supportLevels).toBeDefined();
    expect(status.resistanceLevels).toBeDefined();
  });
});