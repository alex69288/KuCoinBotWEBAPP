# Инструкция по развертыванию в Amvera Cloud

## Быстрое развертывание

### 1. Backend
1. Создайте новое приложение в Amvera
2. Подключите GitHub репозиторий
3. Укажите путь: `backend/`
4. Файл `amvera.yaml` будет автоматически обнаружен
5. Добавьте переменные окружения в настройках приложения

### 2. Frontend
1. Создайте новое приложение в Amvera
2. Подключите тот же GitHub репозиторий
3. Укажите путь: `frontend/`
4. Добавьте переменную: `VITE_API_URL=https://your-backend-app.amvera.io/api`

### 3. Redis (опционально, для очередей)
1. Создайте преднастроенный сервис "Redis"
2. Тариф "Начальный" или выше
3. Добавьте секрет: `REDIS_ARGS=--requirepass ваш_пароль`
4. В backend добавьте: `REDIS_URL=redis://amvera-<username>-run-<redis-project>:6379`

### 4. Настройка Telegram бота
- В настройках бота установите Web App URL: `https://your-frontend-app.amvera.io`
- Бот будет автоматически открывать веб-приложение

## Переменные окружения для Backend

Обязательные:
- `KUCOIN_API_KEY` - API ключ KuCoin
- `KUCOIN_API_SECRET` - Секрет KuCoin
- `KUCOIN_API_PASSPHRASE` - Пароль KuCoin
- `TELEGRAM_BOT_TOKEN` - Токен Telegram бота
- `FRONTEND_URL` - URL фронтенда

Опциональные:
- `REDIS_URL` - URL Redis для очередей
- `PORT` - Порт сервера (по умолчанию 5000)

## Домены

После развертывания:
- Backend: `https://kucoinbot-backend-<username>.amvera.io`
- Frontend: `https://kucoinbot-frontend-<username>.amvera.io`

Обновите `WEBAPP_URL` в переменных окружения backend.