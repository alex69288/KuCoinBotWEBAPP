import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import kucoinRoutes from './routes/kucoin.routes.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Routes
app.use('/api/kucoin', kucoinRoutes);

// Telegram Bot - use webhook in production, polling in development
const isProduction = process.env.NODE_ENV === 'production';
console.log(`🔧 Environment: NODE_ENV=${process.env.NODE_ENV}, isProduction=${isProduction}`);

const botOptions = isProduction
  ? {
    webHook: {
      port: parseInt(process.env.PORT || '5000')
    }
  }
  : { polling: true };

console.log(`🤖 Telegram bot mode: ${isProduction ? 'webhook' : 'polling'}`);

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, botOptions);

// Set webhook URL in production
if (isProduction) {
  const webhookUrl = `${process.env.FRONTEND_URL || 'https://kucoinbot-backend-alex69288.amvera.io'}/bot${process.env.TELEGRAM_BOT_TOKEN}`;
  bot.setWebHook(webhookUrl);
  console.log(`✅ Telegram webhook set to: ${webhookUrl}`);
} else {
  console.log('ℹ️ Using Telegram polling for development');
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  bot.stopPolling();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
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
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
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

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});