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
**ОБНОВЛЕНИЕ:** Redis доступен в Amvera Cloud!

1. Создайте преднастроенный сервис "Redis"
2. Тариф "Начальный" или выше
3. **persistenceMount**: `/data` (для сохранения данных Redis)
4. **REDIS_ARGS**: `--requirepass ваш_пароль` (обязательно!)
5. В backend добавьте: `REDIS_URL=redis://amvera-<username>-run-<redis-project>:6379`
6. Добавьте переменную: `REDIS_PASSWORD=ваш_пароль`

**Пример настройки Redis сервиса:**
- persistenceMount: `/data`
- REDIS_ARGS: `--requirepass mySecurePass123`

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

Опциональные (для Redis):
- `REDIS_URL` - URL Redis сервиса Amvera
- `REDIS_PASSWORD` - Пароль Redis (если используется)
- `PORT` - Порт сервера (по умолчанию 5000)

## Домены

После развертывания:
- Backend: `https://kucoinbot-backend-<username>.amvera.io`
- Frontend: `https://kucoinbot-frontend-<username>.amvera.io`

Обновите `WEBAPP_URL` в переменных окружения backend.