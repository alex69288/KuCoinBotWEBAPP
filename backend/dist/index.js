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
// Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
// Socket.io connection
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});
// Basic routes
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Telegram bot commands
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Welcome to KuCoin Trading Bot! Click below to open the web app.', {
        reply_markup: {
            inline_keyboard: [[
                    {
                        text: 'Open Trading Bot',
                        web_app: { url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/?chat_id=${chatId}` }
                    }
                ]]
        }
    });
});
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map