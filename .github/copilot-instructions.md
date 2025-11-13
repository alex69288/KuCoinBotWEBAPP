# Copilot Instructions for KuCoinBotV5WEBAPP

## Overview
This project is a web application for interacting with the KuCoin cryptocurrency exchange, integrated with Model Context Protocol (MCP) servers for AI-powered features. The codebase is a Telegram Web App trading bot with separate frontend and backend architectures.

## Architecture
- **Backend (Node.js/TypeScript)**: Express server with Socket.io for real-time updates, Bull queues for trade processing, Telegram bot integration, and KuCoin API via ccxt library.
- **Frontend (React/TypeScript)**: Vite-based React app with Tailwind CSS, Zustand for state management, React Query for API calls, and Recharts for data visualization.
- **MCP Integration**: Uses `mcp.json` to configure external AI servers (e.g., OpenAI for image generation, context7 for contextual data). Servers are defined with HTTP endpoints or local commands.

## Developer Workflows
- **Backend Build**: Run `npm run build` to compile TypeScript, then `npm start` or `npm run pm2:start` for production with PM2.
- **Frontend Build**: Run `npm run build` for production build, `npm run dev` for development with hot reload.
- **Development**: Use `npm run dev` in both backend and frontend directories. Backend uses ts-node-dev for auto-restart.
- **MCP Setup**: Ensure `mcp.json` has valid API keys (e.g., `OPENAI_API_KEY`, `CONTEXT7_API_KEY`) before running AI features.

## Project Conventions
- **Backend Structure**: `src/` contains main code, `src/routes/` for API endpoints, `src/services/` for business logic, `src/queues/` for Bull job queues.
- **Frontend Structure**: `src/` with `components/`, `store/` (Zustand), `api/` (React Query functions).
- **Configuration**: Environment variables in `.env`, API keys for KuCoin and Telegram bot.
- **Error Handling**: Try-catch blocks in async functions, centralized error responses in Express routes.
- **Async Patterns**: Async/await throughout, especially for KuCoin API calls and queue processing.
- **Type Safety**: Full TypeScript in both frontend and backend with strict mode.
- **MCP Communication**: HTTP requests for remote servers (e.g., context7), subprocess for local servers (e.g., openai-gpt-image-mcp).

## Integration Points
- **KuCoin API**: All exchange interactions via `src/services/kucoin.service.ts` using ccxt library. Supports balance, orders, tickers, order books.
- **Telegram Bot**: Bot commands in `src/index.ts`, Web App integration with inline keyboards.
- **WebSocket**: Socket.io for real-time market data updates between backend and frontend.
- **Job Queues**: Bull for asynchronous trade order processing to prevent blocking.
- **MCP Servers**:
  - `context7`: HTTP-based for contextual AI (configured in `mcp.json`).
  - `openai-gpt-image-mcp`: Local Node.js server for image generation (runs via `node` command).

## Examples
- **Add new KuCoin endpoint**: Create method in `kucoin.service.ts`, add route in `routes/kucoin.routes.ts`, use in frontend via React Query.
- **Add new trading strategy**: Create queue processor in `queues/`, add job type, integrate with frontend order form.
- **Add new UI component**: Create in `components/`, use Zustand store for state, React Query for data.
- **Integrate AI feature**: Configure new server in `mcp.json`, call via HTTP/subprocess in backend service.

## Key Files/Directories
- `backend/src/index.ts`: Main Express server with Telegram bot and Socket.io setup
- `backend/src/services/kucoin.service.ts`: KuCoin API integration via ccxt
- `backend/src/routes/kucoin.routes.ts`: REST API endpoints for trading operations
- `backend/src/queues/trading.queue.ts`: Bull queue for processing trade orders
- `frontend/src/components/TradingInterface.tsx`: Main trading UI with order forms and market data
- `frontend/src/store/trading.store.ts`: Zustand store for trading state management
- `frontend/src/api/kucoin.api.ts`: React Query functions for API calls
- `.env`: Environment variables for API keys and configuration
- `mcp.json`: MCP server configurations

---

> Update this file as the project evolves. Follow the established patterns for new features.