import { KuCoinBot } from '../../backend/src/core/bot';

jest.mock('ccxt', () => ({
  kucoin: jest.fn().mockImplementation(() => ({
    loadMarkets: jest.fn(),
    fetchBalance: jest.fn(),
    createOrder: jest.fn(),
    cancelOrder: jest.fn(),
    fetchOrder: jest.fn(),
    fetchOHLCV: jest.fn(),
  })),
}));

describe('KuCoinBot', () => {
  let bot: any;
  const config = {
    enabled: true,
    demoMode: true,
    maxDailyLoss: 5,
    maxConsecutiveLosses: 3,
    positionSizePercent: 10,
    volatilityLimit: 0.05, // 5%
    minOrderAmount: 10, // 10 USDT
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
    await bot.stop();
  });

  test('should initialize with config', () => {
    expect(bot.getStatus().config).toEqual(config);
  });

  test('should start and stop', async () => {
    await bot.start();
    expect(bot.getStatus().isRunning).toBe(true);

    await bot.stop();
    expect(bot.getStatus().isRunning).toBe(false);
  }, 10000); // Increase timeout

  test('should check risk limits', () => {
    // Нормальные условия
    expect(bot.getStatus().risks.dailyLoss).toBe(0);
    expect(bot.getStatus().risks.consecutiveLosses).toBe(0);
  });

  test('should update config', () => {
    bot.updateConfig({ enabled: false });
    expect(bot.getStatus().config.enabled).toBe(false);
  });

  test('should simulate trades in demo mode', async () => {
    // Установить тестовые данные рынка
    (bot as any).marketData = [{ close: 50000 }];

    const initialBalance = bot.getStatus().stats.currentBalance;

    // Купить
    await (bot as any).executeTrade('BTC/USDT', 'buy', 0.001);
    expect(bot.getStatus().positions.length).toBe(1);
    expect(bot.getStatus().stats.currentBalance).toBeLessThan(initialBalance);

    // Продать
    await (bot as any).executeTrade('BTC/USDT', 'sell', 0.001);
    expect(bot.getStatus().positions.length).toBe(0);
    expect(bot.getStatus().stats.currentBalance).toBeGreaterThanOrEqual(initialBalance);
  });

  test('getMarketUpdate includes commission when calculating toTPPercent', async () => {
    // Prepare environment
    // Set current price via kucoinService mock
    (bot as any).kucoinService.getTicker = async () => ({ last: 10100, percentage: 0 });
    // Provide market data to avoid division by zero
    (bot as any).marketData = [{ close: 10100 }];

    // Add an open position at entryPrice = 10000
    bot.addPosition({ symbol: 'BTC/USDT', side: 'buy', amount: 0.001, entryPrice: 10000, timestamp: Date.now() });

    // Get market update
    const update: any = await bot.getMarketUpdate();

    expect(update.openPositionsCount).toBeGreaterThan(0);

    const commissionPercent = (bot.getStatus().config as any).strategyConfig.commissionPercent;
    const targetNet = ((bot.getStatus().config as any).strategyConfig.takeProfitPercent) / 100;
    const buyFee = commissionPercent / 100;
    const sellFee = commissionPercent / 100;
    const expectedTpPriceAdjusted = 10000 * (1 + targetNet) * (1 + buyFee) / (1 - sellFee);
    const expectedToTPPercent = ((expectedTpPriceAdjusted - 10100) / 10100) * 100;

    expect(Math.abs(update.toTPPercent - expectedToTPPercent)).toBeLessThan(0.0001);
  });
});