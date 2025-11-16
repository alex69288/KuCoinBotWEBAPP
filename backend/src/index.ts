import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
// NOTE: routes import after dotenv.config to avoid creating services before env loaded
import { KuCoinBot } from './core/bot';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve .env priority: prefer backend/.env then fallback to project root .env
const backendEnvPath = path.join(__dirname, '..', '.env');
const rootEnvPath = path.join(__dirname, '..', '..', '.env');
const envPath = fs.existsSync(backendEnvPath) ? backendEnvPath : rootEnvPath;
console.log('Loading .env from:', envPath);
console.log('File exists:', fs.existsSync(envPath));
const result = dotenv.config({ path: envPath });
console.log('dotenv result:', result);
console.log('KUCOIN_API_KEY:', process.env.KUCOIN_API_KEY);

console.log('Starting application...');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const startTime = Date.now();
const PORT = parseInt(process.env.PORT || '8080', 10);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(compression());
app.use(express.json());
// Accept text/csv payloads for trade import
app.use(express.text({ type: ['text/*', 'application/csv', 'text/csv'] }));

// Healthcheck route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Telegram Bot - use webhook if BACKEND_URL is HTTPS, polling otherwise
const useWebhook = process.env.BACKEND_URL?.startsWith('https://') || false;
const isProduction = process.env.NODE_ENV === 'production';
console.log(`🔧 Environment: NODE_ENV=${process.env.NODE_ENV}, isProduction=${isProduction}`);
console.log(`🔧 URLs: FRONTEND_URL=${process.env.FRONTEND_URL}, BACKEND_URL=${process.env.BACKEND_URL}`);
console.log(`🔧 Bot Token: ${process.env.TELEGRAM_BOT_TOKEN ? 'present' : 'missing'}`);

const botOptions = useWebhook
  ? {
    webHook: {
      port: parseInt(process.env.PORT || '5000')
    }
  }
  : { polling: true };

console.log(`🤖 Telegram bot mode: ${useWebhook ? 'webhook' : 'polling'}`);

try {
  // Import and initialize trading queue
  await import('./queues/trading.queue.js');
  // Import routes after dotenv is configured so services read env vars properly
  const kucoinRoutes = (await import('./routes/kucoin.routes.js')).default;
  const botRoutesFactory = (await import('./routes/bot.routes.js')).default;
  console.log('✅ Trading queue initialized');

  // Initialize KuCoin Bot
  const botConfig = {
    enabled: process.env.BOT_ENABLED !== 'false',
    demoMode: process.env.DEMO_MODE === 'true',
    maxDailyLoss: parseFloat(process.env.MAX_DAILY_LOSS || '5'),
    maxConsecutiveLosses: parseInt(process.env.MAX_CONSECUTIVE_LOSSES || '3'),
    positionSizePercent: parseFloat(process.env.POSITION_SIZE_PERCENT || '1'),
    volatilityLimit: parseFloat(process.env.VOLATILITY_LIMIT || '0.05'),
    minOrderAmount: parseFloat(process.env.MIN_ORDER_AMOUNT || '10'),
    telegramToken: process.env.TELEGRAM_BOT_TOKEN!,
    telegramChatId: process.env.TELEGRAM_CHAT_ID!,
    symbols: (process.env.TRADING_SYMBOLS || 'BTC/USDT').split(','),
    strategy: (process.env.TRADING_STRATEGY || 'ema-ml') as 'ema-ml',
    strategyConfig: {
      symbol: (process.env.TRADING_SYMBOLS || 'BTC/USDT').split(',')[0],
      fastPeriod: parseInt(process.env.EMA_FAST_PERIOD || '12'),
      slowPeriod: parseInt(process.env.EMA_SLOW_PERIOD || '26'),
      emaThreshold: parseFloat(process.env.EMA_THRESHOLD || '0.5'),
      mlBuyThreshold: parseFloat(process.env.ML_BUY_THRESHOLD || '0.6'),
      mlSellThreshold: parseFloat(process.env.ML_SELL_THRESHOLD || '0.4'),
      takeProfitPercent: parseFloat(process.env.TAKE_PROFIT_PERCENT || '2'),
      stopLossPercent: parseFloat(process.env.STOP_LOSS_PERCENT || '1'),
      commissionPercent: parseFloat(process.env.COMMISSION_PERCENT || '0.1'),
      trailingStop: process.env.TRAILING_STOP === 'true',
      minHoldTime: parseInt(process.env.MIN_HOLD_TIME || '60')
    },
  };

  const kucoinBot = KuCoinBot.getInstance(botConfig);

  // Routes
  app.use('/api/kucoin', kucoinRoutes);
  app.use('/api/bot', botRoutesFactory(kucoinBot));

  // One-time manual positions from CSV (hardcoded two open buys)
  try {
    // These two positions come from the provided CSV and represent remaining open buys
    const manualPositions = [
      {
        symbol: (botConfig.strategyConfig as any).symbol || 'BTC/USDT',
        side: 'buy',
        amount: 0.00001,
        entryPrice: 110185.7,
        timestamp: new Date('2025-11-02T05:40:27Z').getTime()
      },
      {
        symbol: (botConfig.strategyConfig as any).symbol || 'BTC/USDT',
        side: 'buy',
        amount: 0.00001,
        entryPrice: 103573.5,
        timestamp: new Date('2025-11-06T00:41:35Z').getTime()
      }
    ];
    for (const p of manualPositions) {
      try { kucoinBot.addPosition(p as any); } catch (e) { console.warn('Failed to add manual position', e); }
    }
  } catch (e) {
    console.warn('Failed to add manual positions:', e);
  }

  // One-time import of trades from CSV file if present (for manual restoration)
  try {
    const importsDir = path.join(__dirname, '..', 'imports');
    const importFile = path.join(importsDir, 'initial_trades.csv');
    if (fs.existsSync(importFile)) {
      try {
        const csv = fs.readFileSync(importFile, 'utf8');
        console.log('Found initial trades CSV, importing...');
        const importResult = await kucoinBot.importTradesCsv(csv);
        console.log('Import result:', importResult);
        // remove file after successful import to avoid repeated imports
        try { fs.unlinkSync(importFile); console.log('Initial trades CSV removed after import'); } catch (e) { console.warn('Failed to remove import file:', e); }
      } catch (e) {
        console.error('Failed to read/import initial trades CSV:', e);
      }
    }
  } catch (e) {
    console.warn('Import step failed:', e);
  }

  if (botConfig.enabled) {
    await kucoinBot.start();
    console.log('✅ KuCoin Bot started');
  } else {
    console.log('ℹ️ KuCoin Bot disabled');
  }

  const botOptions = useWebhook ? {} : { polling: true };
  let bot: TelegramBot | undefined;
  if (process.env.TELEGRAM_BOT_TOKEN && isProduction) {  // Only create bot in production to avoid conflicts
    try {
      bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, botOptions);
    } catch (error) {
      console.error('Failed to create Telegram bot:', error);
      throw error;
    }
  } else {
    console.log('ℹ️ Telegram bot disabled (no token or not production)');
  }

  // Set webhook URL if using webhook
  if (useWebhook && bot) {
    try {
      // Use BACKEND_URL for webhook, fallback to constructed URL
      const backendUrl = (process.env.BACKEND_URL || `https://kucoinbot-backend-alex69288.amvera.io`).replace(/\/$/, ''); // Remove trailing slash
      const webhookUrl = `${backendUrl}/bot${process.env.TELEGRAM_BOT_TOKEN}`;

      // Check if webhook is already set
      const webhookInfo = await bot.getWebHookInfo();
      console.log(`🔍 Current webhook info: ${JSON.stringify(webhookInfo)}`);

      if (webhookInfo.url === webhookUrl) {
        console.log(`✅ Webhook already set to correct URL: ${webhookUrl}`);
      } else {
        console.log(`🔗 Setting webhook to backend URL: ${backendUrl}`);
        await bot.setWebHook(webhookUrl);
        console.log(`✅ Telegram webhook set to: ${webhookUrl}`);
      }
    } catch (error) {
      console.error('❌ Failed to set webhook:', error);
      // Continue anyway - webhook might already be set
    }
  } else {
    console.log('ℹ️ Using Telegram polling for development');
  }

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    if (kucoinBot) await kucoinBot.stop();
    if (bot) bot.stopPolling();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    if (kucoinBot) await kucoinBot.stop();
    if (bot) bot.stopPolling();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  // Socket.io connection
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  // Telegram webhook endpoint
  app.post(`/bot${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
    if (bot) {
      bot.processUpdate(req.body);
    }
    res.sendStatus(200);
  });

  // Basic routes
  app.get('/health', (req, res) => {
    console.log('Health check requested');
    res.json({ status: 'OK', timestamp: new Date().toISOString(), startTime });
  });

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: 'KuCoin Trading Bot API',
      version: '0.0.3',
      frontend: process.env.FRONTEND_URL || 'http://localhost',
      docs: '/api/docs',
      health: '/health',
      api: {
        kucoin: '/api/kucoin',
        balance: '/api/kucoin/balance',
        ticker: '/api/kucoin/ticker/:symbol',
        orderbook: '/api/kucoin/orderbook/:symbol',
        orders: '/api/kucoin/orders',
        markets: '/api/kucoin/markets'
      }
    });
  });

  // API info endpoint
  app.get('/api', (req, res) => {
    res.json({
      message: 'KuCoin Trading Bot API Endpoints',
      version: '0.0.3',
      endpoints: {
        balance: 'GET /api/kucoin/balance',
        ticker: 'GET /api/kucoin/ticker/:symbol',
        orderbook: 'GET /api/kucoin/orderbook/:symbol',
        createOrder: 'POST /api/kucoin/orders',
        openOrders: 'GET /api/kucoin/orders/open',
        cancelOrder: 'DELETE /api/kucoin/orders/:orderId',
        orderHistory: 'GET /api/kucoin/orders/history',
        trades: 'GET /api/kucoin/trades',
        markets: 'GET /api/kucoin/markets'
      }
    });
  });

  // Telegram bot commands
  if (bot) {
    bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const frontendUrl = process.env.FRONTEND_URL || 'https://kucoinbot-frontend-alex69288.amvera.io';

      bot.sendMessage(chatId, 'Welcome to KuCoin Trading Bot! Click below to open the web app.', {
        reply_markup: {
          inline_keyboard: [[
            {
              text: 'Open Trading Bot',
              web_app: { url: `${frontendUrl}/?chat_id=${chatId}` }
            }
          ]]
        }
      });
    });

    bot.onText(/\/market/, async (msg) => {
      const chatId = msg.chat.id;
      try {
        const update = await kucoinBot.getMarketUpdate();
        const message = `📈 ОБНОВЛЕНИЕ РЫНКА
💱 Пара: ₿ Bitcoin (${update.symbol})
💰 Цена: ${update.price.toFixed(2)} USDT
📊 24ч: ${update.change24h.toFixed(2)}% (${update.change24hAmount?.toFixed(2) || '0.00'} USDT)
📈 EMA: ${update.emaDirection === 'ВВЕРХ' ? '🟢' : '🔴'} ${update.emaDirection} (${update.emaPercent.toFixed(2)}%)
🎯 Сигнал: ${update.signal === 'buy' ? '🟢 ПОКУПКА' : update.signal === 'sell' ? '🔴 ПРОДАЖА' : '⚪️ ОЖИДАНИЕ'}
🤖 ML: ${update.mlConfidence > 0.7 ? '🟢' : update.mlConfidence < 0.4 ? '🔴' : '⚪️'} ${update.mlText} (${update.mlPercent}%)

${update.openPositionsCount > 0 ? `💼 ПОЗИЦИЯ ОТКРЫТА (РЕЖИМ %)
📊 Количество открытых позиций: ${update.openPositionsCount}
💰 Размер ставки: ${update.stakeSize.toFixed(2)} USDT
🎯 Цена входа (TP): ${update.entryPrice.toFixed(2)} USDT
📈 Текущая прибыль: ${update.profitPercent.toFixed(2)}% (${update.currentProfit.toFixed(4)} USDT)
🎯 До Take Profit: ${update.toTPPercent.toFixed(1)}%
🎯 Цель TP: ${update.config?.strategyConfig?.takeProfitPercent || 2}%
🛡️ Комиссии: ${update.config?.strategyConfig?.commissionPercent || 0.2}% (${(Math.abs(update.currentProfit) * ((update.config?.strategyConfig?.commissionPercent || 0.2) / 100)).toFixed(4)} USDT)` : '💼 ПОЗИЦИЙ НЕТ'}`;
        bot.sendMessage(chatId, message);
      } catch (error) {
        bot.sendMessage(chatId, `Ошибка получения обновления рынка: ${(error as Error).message}`);
      }
    });
  }

  // Add delay before starting server to allow previous instance to shut down
  console.log('⏳ Waiting 5 seconds before starting server...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Start server
  console.log('Before server.listen');
  server.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  }).on('error', (error: any) => {
    console.error('Failed to start server:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please check if another instance is running.`);
      console.error('💡 Try waiting longer or check Amvera configuration');
    }
    process.exit(1);
  });

} catch (error) {
  console.error('Failed to initialize application:', error);
  process.exit(1);
}