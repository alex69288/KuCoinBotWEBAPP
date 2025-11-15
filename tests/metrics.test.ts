import { calculateTotalTrades, calculateWinRate, calculateProfitFactor, calculateTotalProfit, calculateMaxDrawdown, calculateBestAndWorstTrades, calculateAverageProfitAndLoss, calculateStreaks } from '../backend/src/metrics';
import { Trade } from '../backend/src/core/bot';

describe('Metrics Calculations', () => {
  const mockTrades: Trade[] = [
    { id: '1', symbol: 'BTC/USDT', side: 'buy', amount: 1, profit: 100, timestamp: Date.now() },
    { id: '2', symbol: 'BTC/USDT', side: 'sell', amount: 1, profit: -50, timestamp: Date.now() },
    { id: '3', symbol: 'BTC/USDT', side: 'buy', amount: 1, profit: 200, timestamp: Date.now() },
    { id: '4', symbol: 'BTC/USDT', side: 'sell', amount: 1, profit: -100, timestamp: Date.now() },
  ];

  test('calculateTotalTrades', () => {
    expect(calculateTotalTrades(mockTrades)).toBe(4);
  });

  test('calculateWinRate', () => {
    expect(calculateWinRate(mockTrades)).toBe(50);
  });

  test('calculateProfitFactor', () => {
    expect(calculateProfitFactor(mockTrades)).toBeCloseTo(2, 1);
  });

  test('calculateTotalProfit', () => {
    const result = calculateTotalProfit(mockTrades, 1000);
    expect(result.usdt).toBe(150);
    expect(result.percentage).toBeCloseTo(15, 1);
  });

  test('calculateMaxDrawdown', () => {
    expect(calculateMaxDrawdown(mockTrades)).toBe(100);
  });

  test('calculateBestAndWorstTrades', () => {
    const result = calculateBestAndWorstTrades(mockTrades);
    expect(result.best?.profit).toBe(200);
    expect(result.worst?.profit).toBe(-100);
  });

  test('calculateAverageProfitAndLoss', () => {
    const result = calculateAverageProfitAndLoss(mockTrades);
    expect(result.averageProfit).toBe(150);
    expect(result.averageLoss).toBe(75);
  });

  test('calculateStreaks', () => {
    const result = calculateStreaks(mockTrades);
    expect(result.winningStreak).toBe(1);
    expect(result.losingStreak).toBe(1);
  });
});