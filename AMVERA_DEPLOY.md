# Инструкция по развертыванию в Amvera Cloud

## Быстрое развертывание

### 1. Backend
1. Создайте новое приложение в Amvera
2. Выберите тип: **Node.js Server**
3. Подключите GitHub репозиторий
4. Укажите путь: `backend/`
5. Файл `amvera.yaml` будет автоматически обнаружен
6. Добавьте переменные окружения в настройках приложения

### 2. Frontend
1. Создайте новое приложение в Amvera
2. Выберите тип: **Node.js Browser**
3. Подключите тот же GitHub репозиторий
4. Укажите путь: `frontend/`
5. Файл `amvera.yaml` будет автоматически обнаружен
6. Добавьте переменную: `VITE_API_URL=https://your-backend-app.amvera.io/api`

**Примечание:** Для Node.js Browser Amvera автоматически:
- Выполняет `npm run build`
- Запускает `npm run preview` на порту 4173
- Служит статические файлы

### 3. Redis (рекомендуется для очередей)
Redis доступен в Amvera Cloud!

1. Создайте преднастроенный сервис "Redis"
2. Тариф "Начальный" или выше
3. **persistenceMount**: `/data` (обязательно для сохранения данных Redis)
4. **REDIS_ARGS**: `--requirepass ваш_пароль` (обязательно для безопасности!)
5. В backend добавьте переменные:
   - `REDIS_URL=redis://amvera-<username>-run-<redis-project>:6379`
   - `REDIS_PASSWORD=ваш_пароль`

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

## Устранение неполадок

### Ошибка сборки Frontend
Если сборка frontend падает, проверьте:
1. **Тип сервиса**: Должен быть **"Node.js Browser"**, не "Node.js Server"
2. **Переменные окружения**: `VITE_API_URL` должен быть установлен (например: `https://your-backend-app.amvera.io/api`)
3. **Путь к проекту**: Укажите `frontend/` в настройках репозитория
4. **Конфигурация**: Убедитесь, что `amvera.yaml` содержит правильные настройки для browser environment

### Ошибка сборки Backend
Если сборка backend падает, проверьте:
1. **Тип сервиса**: Должен быть **"Node.js Server"**
2. **Переменные окружения**: Все обязательные переменные установлены
3. **Путь к проекту**: Укажите `backend/` в настройках репозитория
4. **Конфигурация**: Убедитесь, что `amvera.yaml` содержит правильные настройки для server environment

### Redis подключение
Если Redis не подключается:
1. Проверьте `REDIS_URL` и `REDIS_PASSWORD`
2. Убедитесь, что Redis сервис запущен
3. Проверьте логи Redis сервиса
4. Убедитесь, что `persistenceMount: /data` и `REDIS_ARGS: --requirepass ваш_пароль` настроены

### Переменные окружения не применяются
1. Проверьте, что переменные добавлены в разделе "Переменные окружения" сервиса
2. Перезапустите сервис после изменения переменных
3. Проверьте логи приложения на наличие ошибок конфигурации