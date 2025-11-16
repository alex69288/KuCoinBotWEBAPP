# KuCoin Trading Bot WebApp

A Telegram Web App for automated trading on KuCoin cryptocurrency exchange with AI-powered strategies and real-time market monitoring.

## Features

- 📱 Telegram Web App interface
- 📊 Real-time market data (tickers, order books)
- 💰 Balance management
- 🤖 Automated trading with AI strategies (EMA+ML, MACD+RSI, Bollinger Bands, Price Action)
- ⚙️ Strategy configuration with risk management
- 📈 Real-time trading statistics and analytics
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
   For local development we recommend separating env vars per service:

   Backend (create `backend/.env`):
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your KuCoin and Telegram keys
   ```

   Frontend (optional, for local build):
   ```bash
   cp frontend/.env.example frontend/.env
   # Edit frontend/.env with VITE_API_URL
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
   ```

6. **Production deployment**

   For local production testing or server deployment:
   ```bash
   # Windows
   start-production.bat
   ```

7. **Access the application**
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

#### Variable Descriptions
- `PORT` - Server port (default: 5000)
- `FRONTEND_URL` - Frontend application URL for CORS
- `KUCOIN_API_KEY` - KuCoin API key (leave empty for sandbox mode)
- `KUCOIN_API_SECRET` - KuCoin API secret
- `KUCOIN_API_PASSPHRASE` - KuCoin API passphrase
- `TELEGRAM_BOT_TOKEN` - Telegram bot token from @BotFather
- `REDIS_URL` - Redis connection URL for Bull queues (default: redis://127.0.0.1:6379)

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

### Git Setup

1. **SSH Key Setup (Recommended)**:
   ```bash
   # Run setup script
   setup-ssh.bat

   # Or manually:
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ssh-add ~/.ssh/id_ed25519
   ```

   Add the public key (`cat ~/.ssh/id_ed25519.pub`) to GitHub: Settings → SSH and GPG keys

2. **Or use Personal Access Token**:
   ```bash
   git remote set-url origin https://github.com/alex69288/KuCoinBotV5.git
   # Use your GitHub username and token when prompted
   ```

## Deployment on Amvera

This project is configured for deployment on [Amvera Cloud](https://amvera.ru/).

### Backend Deployment

1. **Create Backend Application**:
   - Go to Amvera dashboard
   - Create new application
   - Connect your GitHub repository
   - The `backend/amvera.yaml` file will be automatically detected

2. **Configure Environment Variables**:
   In the application settings, add these variables:
   ```
   KUCOIN_API_KEY=your_kucoin_api_key
   KUCOIN_API_SECRET=your_kucoin_secret
   KUCOIN_API_PASSPHRASE=your_kucoin_passphrase
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   FRONTEND_URL=https://your-frontend-app.amvera.io
   REDIS_URL=redis://amvera-<username>-run-<redis-project>:6379
   ```

3. **Create Redis Database**:
   - Create a new pre-configured service
   - Choose "Databases" → "Redis"
   - Set tariff "Начальный" or higher
   - Add environment variable: `REDIS_ARGS=--requirepass your_strong_password`
   - Note the internal domain name for connection

### Frontend Deployment

1. **Create Frontend Application**:
   - Create new application in Amvera
   - Connect the same GitHub repository
   - Set source path to `frontend/`
   - The `frontend/amvera.yaml` will be automatically detected

2. **Configure Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-app.amvera.io/api
   ```

### Networking Setup

1. **Backend Networking**:
   - The backend will be available at `https://kucoinbot-backend-<username>.amvera.io`

2. **Frontend Networking**:
   - The frontend will be available at `https://kucoinbot-frontend-<username>.amvera.io`

3. **Update Telegram Bot**:
   - Set web app URL in bot settings to your frontend URL
   - Add `?chat_id=<user_id>` parameter support

### Database Connection

For production, connect the backend to Redis:
- Create Redis service in Amvera
- Use the internal domain: `amvera-<username>-run-<redis-project>`
- Port: `6379`
- Set `REDIS_URL` in backend environment variables

## License

MIT License