# KuCoin Trading Bot WebApp

Трейдинговый бот для биржи KuCoin с веб-интерфейсом в Telegram.

## Описание

Этот проект представляет собой полнофункциональный трейдинговый бот для криптовалютной биржи KuCoin. Бот предоставляет:

- Веб-интерфейс в Telegram для удобного управления
- Интеграцию с KuCoin API для выполнения торговых операций
- Асинхронную обработку ордеров через очереди (Bull + Redis)
- Реал-тайм мониторинг рынка и портфеля
- Безопасную обработку API ключей

## Архитектура

Проект состоит из двух основных частей:

### Backend (Node.js + TypeScript)
- **Express.js** - веб-сервер и REST API
- **Socket.io** - веб-сокеты для реал-тайм обновлений
- **ccxt** - унифицированная библиотека для работы с криптобиржами
- **Bull** - очередь задач на Redis для обработки ордеров
- **Telegram Bot API** - интеграция с Telegram

### Frontend (React + TypeScript)
- **React 18** - пользовательский интерфейс
- **Vite** - сборщик и dev-сервер
- **Tailwind CSS** - стилизация
- **Zustand** - управление состоянием
- **React Query** - управление серверными состояниями
- **Recharts** - графики и визуализация данных

## Требования

- Node.js 20+
- Redis (для очередей)
- Аккаунт на KuCoin с API ключами
- Бот в Telegram (через @BotFather)

## Установка

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd KuCoinBotV5WEBAPP
```

### 2. Установка зависимостей

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```env
# KuCoin API
KUCOIN_API_KEY=your_kucoin_api_key
KUCOIN_API_SECRET=your_kucoin_api_secret
KUCOIN_API_PASSPHRASE=your_kucoin_api_passphrase

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Redis
REDIS_URL=redis://localhost:6379

# Server
PORT=3001
NODE_ENV=development
```

### 4. Запуск Redis

Убедитесь, что Redis запущен на вашем компьютере:

```bash
# На Windows с Redis Desktop Manager или
redis-server
```

### 5. Запуск приложения

#### Режим разработки

```bash
# Backend
cd backend
npm run dev

# Frontend (в новом терминале)
cd frontend
npm run dev
```

#### Продакшн сборка

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

## Использование

### Telegram Bot

1. Найдите бота в Telegram по username
2. Отправьте команду `/start`
3. Используйте следующие команды:

| Команда | Описание | Пример |
|---------|----------|---------|
| `/start` | Запуск бота | `/start` |
| `/balance` | Просмотр баланса | `/balance` |
| `/buy <symbol> <amount> <price>` | Купить криптовалюту | `/buy BTC/USDT 0.001 50000` |
| `/sell <symbol> <amount> <price>` | Продать криптовалюту | `/sell BTC/USDT 0.001 51000` |
| `/orders` | Просмотр открытых ордеров | `/orders` |
| `/cancel <order_id>` | Отмена ордера | `/cancel 12345` |
| `/help` | Справка по командам | `/help` |

### Веб-интерфейс

Откройте браузер и перейдите по адресу `http://localhost:5173` (для режима разработки).

Веб-интерфейс предоставляет:
- Графики цен в реальном времени
- Формы для создания ордеров
- Мониторинг баланса
- Историю торгов

## API Endpoints

### REST API

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/kucoin/balance` | Получить баланс аккаунта |
| GET | `/api/kucoin/ticker/:symbol` | Получить тикер для символа |
| GET | `/api/kucoin/orderbook/:symbol` | Получить книгу ордеров |
| POST | `/api/kucoin/order` | Создать новый ордер |
| GET | `/api/kucoin/orders/open` | Получить открытые ордера |
| DELETE | `/api/kucoin/order/:orderId` | Отменить ордер |
| GET | `/api/kucoin/markets` | Получить список рынков |

### WebSocket Events

- `balance:update` - обновление баланса
- `ticker:update` - обновление тикера
- `order:created` - ордер создан
- `order:filled` - ордер выполнен

## Безопасность

- API ключи KuCoin хранятся в переменных окружения
- Используется CORS для защиты от несанкционированного доступа
- Helmet.js для дополнительных заголовков безопасности
- Валидация всех входящих данных

## Тестирование

```bash
cd backend
npm test
```

Тесты включают:
- Unit-тесты для сервисов KuCoin
- Интеграционные тесты для API
- Тесты для Telegram бота
- Тесты для очередей обработки

## Развертывание

Проект настроен для развертывания на Amvera Cloud:

### Backend
- Использует `backend/amvera.yaml`
- Node.js сервер с Express
- Автоматическая сборка и запуск

### Frontend
- Использует `frontend/amvera.yaml`
- React SPA с Vite
- Статические файлы

### Redis
- Развертывается как отдельный сервис Amvera
- Используется для очередей Bull

Подробная инструкция по развертыванию в `AMVERA_DEPLOY.md`.

## Структура проекта

```
KuCoinBotV5WEBAPP/
├── backend/                 # Backend Node.js
│   ├── src/
│   │   ├── index.ts        # Главный сервер
│   │   ├── services/       # Бизнес-логика
│   │   ├── routes/         # API маршруты
│   │   ├── queues/         # Очереди задач
│   │   └── middleware/     # Middleware
│   ├── amvera.yaml         # Конфиг Amvera
│   └── package.json
├── frontend/                # Frontend React
│   ├── src/
│   │   ├── components/     # React компоненты
│   │   ├── pages/          # Страницы
│   │   ├── store/          # Zustand store
│   │   └── api/            # API клиенты
│   ├── amvera.yaml         # Конфиг Amvera
│   └── package.json
├── tests/                   # Тесты
├── docs/                    # Документация
├── .env                     # Переменные окружения
└── README.md               # Основная документация
```

## Лицензия

MIT License

## Поддержка

При возникновении проблем:
1. Проверьте логи сервера
2. Убедитесь в корректности API ключей
3. Проверьте подключение к Redis
4. Запустите тесты для диагностики