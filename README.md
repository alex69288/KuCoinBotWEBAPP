# KuCoin Trading Bot WebApp

A Telegram Web App for trading on KuCoin cryptocurrency exchange with real-time market data and AI-powered features.

## Features

- 📱 Telegram Web App interface
- 📊 Real-time market data (tickers, order books)
- 💰 Balance management
- 📈 Trading order placement (limit/market, buy/sell)
- 🔄 Asynchronous order processing with Bull queues
- 🤖 AI integration via Model Context Protocol (MCP)
- ⚡ WebSocket real-time updates

## Tech Stack

### Backend
- **Node.js 20+** with TypeScript
- **Express** - Web framework
- **Socket.io** - Real-time communication
- **ccxt** - KuCoin API integration
- **node-telegram-bot-api** - Telegram bot
- **Bull** - Job queues
- **PM2** - Process management

### Frontend
- **React 18** with TypeScript
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Query** - API state management
- **Recharts** - Data visualization

## Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn
- Telegram Bot Token (from @BotFather)
- KuCoin API credentials (optional, uses sandbox if not provided)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd KuCoinBotV5WEBAPP
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

5. **Start development servers**

   Option 1 - Manual:
   ```bash
   # Backend (Terminal 1)
   cd backend
   npm run dev

   # Frontend (Terminal 2)
   cd frontend
   npm run dev
   ```

   Option 2 - Auto-start script:
   ```bash
   # Windows
   start-dev.bat

   # Linux/Mac
   chmod +x start-dev.sh
   ./start-dev.sh
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Configuration

### Environment Variables (.env)

```env
# Server Configuration
PORT=5000
FRONTEND_URL=http://localhost:3000

# KuCoin API (leave empty for sandbox mode)
KUCOIN_API_KEY=your_kucoin_api_key
KUCOIN_API_SECRET=your_kucoin_secret
KUCOIN_API_PASSPHRASE=your_kucoin_passphrase

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Redis for Bull queues (optional)
REDIS_URL=redis://localhost:6379
```

### Telegram Bot Setup

1. Create a bot with @BotFather on Telegram
2. Get your bot token
3. Set webhook or use polling (configured for polling)
4. Add Web App to bot commands

## Project Structure

```
KuCoinBotV5WEBAPP/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Main server
│   │   ├── routes/
│   │   │   └── kucoin.routes.ts  # API routes
│   │   ├── services/
│   │   │   └── kucoin.service.ts # KuCoin API service
│   │   └── queues/
│   │       └── trading.queue.ts  # Bull queues
│   ├── package.json
│   ├── tsconfig.json
│   └── ecosystem.config.js       # PM2 config
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── TradingInterface.tsx
│   │   ├── store/
│   │   │   └── trading.store.ts
│   │   ├── api/
│   │   │   └── kucoin.api.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── .env                          # Environment variables
├── mcp.json                      # MCP server configurations
└── .github/
    └── copilot-instructions.md   # AI assistant guidelines
```

## API Endpoints

### KuCoin Trading API
- `GET /api/kucoin/balance` - Get account balance
- `GET /api/kucoin/ticker/:symbol` - Get ticker data
- `GET /api/kucoin/orderbook/:symbol` - Get order book
- `POST /api/kucoin/orders` - Create trading order
- `GET /api/kucoin/orders/open` - Get open orders
- `DELETE /api/kucoin/orders/:orderId` - Cancel order
- `GET /api/kucoin/markets` - Get available markets

## Development

### Building for Production

Backend:
```bash
cd backend
npm run build
npm run pm2:start
```

Frontend:
```bash
cd frontend
npm run build
```

### Testing
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Deployment

### Backend
```bash
cd backend
npm run build
npm run pm2:start
```

### Frontend
Build and serve static files, or deploy to Vercel/Netlify.

## Contributing

1. Follow the established code patterns
2. Update `.github/copilot-instructions.md` for new features
3. Add tests for new functionality
4. Use meaningful commit messages

## License

MIT License