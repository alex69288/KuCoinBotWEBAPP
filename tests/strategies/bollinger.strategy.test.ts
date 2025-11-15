import { BollingerBandsStrategy, BollingerBandsConfig } from '../../backend/src/strategies/bollinger.strategy';
import { OHLCVData } from '../../backend/src/strategies/base.strategy';

describe('Bollinger Bands Strategy', () => {
  const config: BollingerBandsConfig = {
    symbol: 'BTC/USDT',
    period: 20,
    multiplier: 2,
    takeProfitPercent: 4,
    stopLossPercent: 2,
    commissionPercent: 0.1,
  };

  let strategy: BollingerBandsStrategy;

  beforeEach(() => {
    strategy = new BollingerBandsStrategy(config);
  });

  const mockData: OHLCVData[] = Array.from({ length: 30 }, (_, i) => ({
    open: 100,
    high: 105,
    low: 95,
    close: 100,
    volume: 1000,
    timestamp: i,
  }));

  it('should return hold if data length is less than period', () => {
    const shortData = mockData.slice(0, 10);
    const signal = strategy.calculateSignal(shortData);
    expect(signal).toBe('hold');
  });

  it('should return buy if price is below lower band', () => {
    const modifiedData = [...mockData];
    modifiedData[modifiedData.length - 1].close = 80;
    const signal = strategy.calculateSignal(modifiedData);
    expect(signal).toBe('buy');
  });

  it('should return hold if price is above upper band', () => {
    const modifiedData = [...mockData];
    modifiedData[modifiedData.length - 1].close = 200;
    const signal = strategy.calculateSignal(modifiedData);
    expect(signal).toBe('hold');
  });

  it('should return hold if price is at upper band', () => {
    const signal = strategy.calculateSignal(mockData);
    expect(signal).toBe('hold');
  });

  it('should return sell on take profit after buy', () => {
    // First buy
    const buyData = [...mockData];
    buyData[buyData.length - 1].close = 80;
    strategy.calculateSignal(buyData); // Should set buy

    // Then check take profit
    const profitData = [...mockData];
    profitData[profitData.length - 1].close = 80 * 1.05; // 5% profit
    const signal = strategy.calculateSignal(profitData);
    expect(signal).toBe('sell');
  });
});