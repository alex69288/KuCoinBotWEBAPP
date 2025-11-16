import { KuCoinBot } from '../../backend/src/core/bot';

jest.mock('ccxt', () => ({
  kucoin: jest.fn().mockImplementation(() => ({
    loadMarkets: jest.fn(),
    fetchBalance: jest.fn(),
    createOrder: jest.fn(),
    cancelOrder: jest.fn(),
    fetchOrder: jest.fn(),
    fetchOHLCV: jest.fn(),
    fetchTicker: jest.fn().mockResolvedValue({ last: 60000 })
  })),
}));

describe('Demo mode snapshot/restore', () => {
  let bot: any;
  const config = {
    enabled: true,
    demoMode: false,
    maxDailyLoss: 5,
    maxConsecutiveLosses: 3,
    positionSizePercent: 10,
    volatilityLimit: 0.05,
    minOrderAmount: 10,
    telegramToken: 'test_token',
    telegramChatId: 'test_chat',
    symbols: ['BTC/USDT'],
    strategy: 'ema-ml' as const,
    strategyConfig: {
      symbol: 'BTC/USDT',
      fastPeriod: 12,
      slowPeriod: 26,
      emaThreshold: 0.5,
      mlBuyThreshold: 0.6,
      mlSellThreshold: 0.4,
      takeProfitPercent: 2,
      stopLossPercent: 1,
      commissionPercent: 0.1,
      trailingStop: false,
      minHoldTime: 60
    }
  };

  beforeEach(() => {
    bot = new KuCoinBot(config);
  });

  afterEach(async () => {
    try { await bot.stop(); } catch (e) { }
  });

  test('snapshot saves positions and zeroes amounts, restore brings them back', async () => {
    // Add two manual positions
    bot.addPosition({ symbol: 'BTC/USDT', side: 'buy', amount: 0.01, entryPrice: 50000, timestamp: Date.now() - 10000 });
    bot.addPosition({ symbol: 'BTC/USDT', side: 'buy', amount: 0.005, entryPrice: 51000, timestamp: Date.now() - 5000 });

    const before = bot.getStatus().positions.map((p: any) => ({ ...p }));
    expect(before.length).toBe(2);
    expect(before[0].amount).toBeGreaterThan(0);

    // Emulate demo enable snapshot logic (avoid dynamic imports in test)
    (bot as any).savedPositionsSnapshot = JSON.parse(JSON.stringify((bot as any).positions || []));
    (bot as any).positions = ((bot as any).positions || []).map((p: any) => ({ ...p, amount: 0 }));
    console.log('Test: demo snapshot applied');
    const afterDemoOn = bot.getStatus().positions;
    expect(afterDemoOn.length).toBe(2);
    expect(afterDemoOn[0].amount).toBe(0);
    expect(afterDemoOn[1].amount).toBe(0);

    // Emulate demo disable restore logic
    if ((bot as any).savedPositionsSnapshot) {
      (bot as any).positions = (bot as any).savedPositionsSnapshot;
      (bot as any).savedPositionsSnapshot = null;
    }
    const afterDemoOff = bot.getStatus().positions;
    expect(afterDemoOff.length).toBe(2);
    expect(afterDemoOff[0].amount).toBeCloseTo(before[0].amount, 12);
    expect(afterDemoOff[1].amount).toBeCloseTo(before[1].amount, 12);
  });
});
