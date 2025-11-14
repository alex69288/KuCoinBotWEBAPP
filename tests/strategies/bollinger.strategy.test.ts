import { BollingerBandsStrategy, BollingerBandsConfig } from '../../backend/src/strategies/bollinger.strategy';
import { OHLCVData } from '../../backend/src/strategies/base.strategy';

describe('Bollinger Bands Strategy', () => {
  const config: BollingerBandsConfig = {
    period: 20,
    multiplier: 2,
    takeProfitPercent: 5,
    stopLossPercent: 2,
  };

  const strategy = new BollingerBandsStrategy(config);

  const mockData: OHLCVData[] = Array.from({ length: 30 }, (_, i) => ({
    open: 100 + i,
    high: 105 + i,
    low: 95 + i,
    close: 100 + i,
    volume: 1000,
    timestamp: i,
  }));

  it('should return hold if data length is less than period', () => {
    const shortData = mockData.slice(0, 10);
    const signal = strategy.calculateSignal(shortData);
    expect(signal).toBe('hold');
  });

  it('should return buy if price is below lower band', () => {
    const signal = strategy.calculateSignal(mockData.map(d => ({ ...d, close: 80 })));
    expect(signal).toBe('buy');
  });

  it('should return sell if price is above upper band', () => {
    const signal = strategy.calculateSignal(mockData.map(d => ({ ...d, close: 200 })));
    expect(signal).toBe('sell');
  });

  it('should return hold if price is within bands', () => {
    const signal = strategy.calculateSignal(mockData);
    expect(signal).toBe('hold');
  });
});