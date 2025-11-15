import { Router } from 'express';
import { KuCoinBot } from '../core/bot.js';

const router = Router();
const bot = KuCoinBot.getInstance();

// Get bot status
router.get('/status', async (req, res) => {
  try {
    const status = bot.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'failedToGetBotStatus' });
  }
});

// Start bot
router.post('/start', async (req, res) => {
  try {
    await bot.start();
    res.json({ message: 'botStarted' });
  } catch (error) {
    res.status(500).json({ error: 'failedToStartBot' });
  }
});

// Stop bot
router.post('/stop', async (req, res) => {
  try {
    await bot.stop();
    res.json({ message: 'botStopped' });
  } catch (error) {
    res.status(500).json({ error: 'failedToStopBot' });
  }
});

// Get bot configuration
router.get('/config', async (req, res) => {
  try {
    const config = bot.getConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'failedToGetBotConfig' });
  }
});

// Update bot configuration
router.put('/config', async (req, res) => {
  try {
    const { strategy, strategyConfig, enabled, maxDailyLoss, positionSizePercent } = req.body;

    const newConfig = {
      strategy: strategy || bot.getConfig().strategy,
      strategyConfig: strategyConfig || bot.getConfig().strategyConfig,
      enabled: enabled !== undefined ? enabled : bot.getConfig().enabled,
      maxDailyLoss: maxDailyLoss || bot.getConfig().maxDailyLoss,
      positionSizePercent: positionSizePercent || bot.getConfig().positionSizePercent
    };

    bot.updateConfig(newConfig);
    res.json({ message: 'configUpdated' });
  } catch (error) {
    res.status(500).json({ error: 'failedToUpdateConfig' });
  }
});

// Get available strategies
router.get('/strategies', async (req, res) => {
  try {
    const strategies = [
      {
        id: 'ema-ml',
        name: 'EMA + ML',
        description: 'EMA + ML Strategy'
      },
      {
        id: 'macd-rsi',
        name: 'MACD + RSI',
        description: 'MACD + RSI Strategy'
      },
      {
        id: 'price-action',
        name: 'Price Action',
        description: 'Price Action Strategy'
      }
    ];
    res.json(strategies);
  } catch (error) {
    res.status(500).json({ error: 'failedToGetStrategies' });
  }
});

// Get trading statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = bot.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'failedToGetStats' });
  }
});

// Get market data for charts
router.get('/market-data/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { timeframe = '1h', limit = 100 } = req.query;

    const mockData = {
      symbol,
      timeframe,
      data: []
    };

    res.json(mockData);
  } catch (error) {
    res.status(500).json({ error: 'failedToGetMarketData' });
  }
});

// Manual trade (for testing)
router.post('/trade', async (req, res) => {
  try {
    const { symbol, side, amount, type = 'market' } = req.body;

    const result = await bot.manualTrade(symbol, side, amount, type);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'failedToExecuteTrade' });
  }
});

// Enable or disable demo mode
router.post('/demo-mode', (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'Invalid value for enabled' });
  }
  bot.setDemoMode(enabled);
  res.json({ message: `Demo mode ${enabled ? 'enabled' : 'disabled'}` });
});

// Get demo trades
router.get('/demo-trades', (req, res) => {
  const trades = bot.getDemoTrades();
  res.json(trades);
});

// Clear demo trades
router.delete('/demo-trades', (req, res) => {
  bot.clearDemoTrades();
  res.json({ message: 'Demo trades cleared' });
});

export default router;