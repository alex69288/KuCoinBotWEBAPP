import { KuCoinBot } from '../backend/src/core/bot';

describe('KuCoinBot', () => {
  let bot: KuCoinBot;
  const config = {
    enabled: true,
    demoMode: true,
    maxDailyLoss: 5,
    maxConsecutiveLosses: 3,
    positionSizePercent: 10,
    telegramToken: 'test_token',
    telegramChatId: 'test_chat',
    symbols: ['BTC/USDT'],
  };

  beforeEach(() => {
    bot = new KuCoinBot(config);
  });

  test('should initialize with config', () => {
    expect(bot.getStatus().config).toEqual(config);
  });

  test('should start and stop', async () => {
    await bot.start();
    expect(bot.getStatus().isRunning).toBe(true);

    await bot.stop();
    expect(bot.getStatus().isRunning).toBe(false);
  });

  test('should check risk limits', () => {
    // Нормальные условия
    expect(bot.getStatus().risks.dailyLoss).toBe(0);
    expect(bot.getStatus().risks.consecutiveLosses).toBe(0);
  });

  test('should update config', () => {
    bot.updateConfig({ enabled: false });
    expect(bot.getStatus().config.enabled).toBe(false);
  });
});