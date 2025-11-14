import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import kucoinRoutes from './routes/kucoin.routes';
import botRoutes from './routes/bot.routes';
import { KuCoinBot } from './core/bot';

dotenv.config();

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
app.use(cors());
app.use(compression());
app.use(express.json());

// Routes
app.use('/api/kucoin', kucoinRoutes);
app.use('/api/bot', botRoutes);

// Healthcheck route
app.get('/health', (req, res) => {
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
  console.log('✅ Trading queue initialized');

  // Initialize KuCoin Bot
  const botConfig = {
    enabled: process.env.BOT_ENABLED !== 'false',
    demoMode: process.env.DEMO_MODE === 'true',
    maxDailyLoss: parseFloat(process.env.MAX_DAILY_LOSS || '5'),
    maxConsecutiveLosses: parseInt(process.env.MAX_CONSECUTIVE_LOSSES || '3'),
    positionSizePercent: parseFloat(process.env.POSITION_SIZE_PERCENT || '1'),
    telegramToken: process.env.TELEGRAM_BOT_TOKEN!,
    telegramChatId: process.env.TELEGRAM_CHAT_ID!,
    symbols: (process.env.TRADING_SYMBOLS || 'BTC/USDT').split(','),
    strategy: (process.env.TRADING_STRATEGY || 'ema-ml') as 'ema-ml',
    strategyConfig: {
      emaPeriod: parseInt(process.env.EMA_PERIOD || '20'),
      mlThreshold: parseFloat(process.env.ML_THRESHOLD || '0.7'),
    },
  };

  const kucoinBot = KuCoinBot.getInstance(botConfig);
  if (botConfig.enabled) {
    await kucoinBot.start();
    console.log('✅ KuCoin Bot started');
  } else {
    console.log('ℹ️ KuCoin Bot disabled');
  }

  const botOptions = useWebhook ? {} : { polling: true };
  let bot: TelegramBot;
  try {
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, botOptions);
  } catch (error) {
    console.error('Failed to create Telegram bot:', error);
    throw error;
  }

  // Set webhook URL if using webhook
  if (useWebhook) {
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
    bot.stopPolling();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    if (kucoinBot) await kucoinBot.stop();
    bot.stopPolling();
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
    bot.processUpdate(req.body);
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

  // Add delay before starting server to allow previous instance to shut down
  if (useWebhook) {
    console.log('⏳ Waiting 5 seconds before starting server...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Start server
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