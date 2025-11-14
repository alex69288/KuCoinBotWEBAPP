import { Router } from 'express';
import { KuCoinBot } from '../core/bot.js';
import i18n from '../i18n.js';

const router = Router();

// Get bot status
router.get('/status', async (req, res) => {
  try {
    const bot = KuCoinBot.getInstance();
    const status = bot.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: i18n.t('failedToGetBotStatus') });
  }
});

// Start bot
router.post('/start', async (req, res) => {
  try {
    const bot = KuCoinBot.getInstance();
    await bot.start();
    res.json({ message: i18n.t('botStarted') });
  } catch (error) {
    res.status(500).json({ error: i18n.t('failedToStartBot') });
  }
});

// Stop bot
router.post('/stop', async (req, res) => {
  try {
    const bot = KuCoinBot.getInstance();
    await bot.stop();
    res.json({ message: i18n.t('botStopped') });
  } catch (error) {
    res.status(500).json({ error: i18n.t('failedToStopBot') });
  }
});

// Get bot configuration
router.get('/config', async (req, res) => {
  try {
    const bot = KuCoinBot.getInstance();
    const config = bot.getConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: i18n.t('failedToGetBotConfig') });
  }
});

// Update bot configuration
router.put('/config', async (req, res) => {
  try {
    const { strategy, strategyConfig, enabled, maxDailyLoss, positionSizePercent } = req.body;
    const bot = KuCoinBot.getInstance();

    // Update configuration
    const newConfig = {
      strategy: strategy || bot.getConfig().strategy,
      strategyConfig: strategyConfig || bot.getConfig().strategyConfig,
      enabled: enabled !== undefined ? enabled : bot.getConfig().enabled,
      maxDailyLoss: maxDailyLoss || bot.getConfig().maxDailyLoss,
      positionSizePercent: positionSizePercent || bot.getConfig().positionSizePercent
    };

    bot.updateConfig(newConfig);
    res.json({ message: i18n.t('configUpdated') });
  } catch (error) {
    res.status(500).json({ error: i18n.t('failedToUpdateConfig') });
  }
});

// Get available strategies
router.get('/strategies', async (req, res) => {
  try {
    const strategies = [
      {
        id: 'ema-ml',
        name: 'EMA + ML',
        description: i18n.t('emaMlStrategyDescription')
      },
      {
        id: 'macd-rsi',
        name: 'MACD + RSI',
        description: i18n.t('macdRsiStrategyDescription')
      },
      {
        id: 'price-action',
        name: 'Price Action',
        description: i18n.t('priceActionStrategyDescription')
      }
    ];
    res.json(strategies);
  } catch (error) {
    res.status(500).json({ error: i18n.t('failedToGetStrategies') });
  }
});

// Get trading statistics
router.get('/stats', async (req, res) => {
  try {
    const bot = KuCoinBot.getInstance();
    const stats = bot.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: i18n.t('failedToGetStats') });
  }
});

// Get market data for charts
router.get('/market-data/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { timeframe = '1h', limit = 100 } = req.query;

    // This would need to be implemented in the bot or service
    // For now, return mock data
    const mockData = {
      symbol,
      timeframe,
      data: []
    };

    res.json(mockData);
  } catch (error) {
    res.status(500).json({ error: i18n.t('failedToGetMarketData') });
  }
});

// Manual trade (for testing)
router.post('/trade', async (req, res) => {
  try {
    const { symbol, side, amount, type = 'market' } = req.body;
    const bot = KuCoinBot.getInstance();

    const result = await bot.manualTrade(symbol, side, amount, type);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: i18n.t('failedToExecuteTrade') });
  }
});

export default router;