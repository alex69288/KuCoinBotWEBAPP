# Развертывание на Amvera Cloud

## Обзор

Проект настроен для развертывания на платформе Amvera Cloud с использованием Docker-контейнеров.

## Архитектура развертывания

### Компоненты
1. **Backend** - Node.js сервер (Express + Socket.io)
2. **Frontend** - React веб-приложение
3. **Redis** - База данных для очередей Bull (опционально, недоступен в РФ)

### Конфигурация
- Backend использует `backend/amvera.yaml`
- Frontend использует `frontend/amvera.yaml`
- Redis развертывается как отдельный сервис

## Подготовка к развертыванию

### 1. Создание аккаунта Amvera
1. Перейдите на [amvera.ru](https://amvera.ru)
2. Зарегистрируйтесь и подтвердите email
3. Создайте новый проект

### 2. Настройка переменных окружения
В панели управления Amvera настройте следующие переменные:

#### Backend переменные (Node.js Server):
```
KUCOIN_API_KEY=ваш_kucoin_api_key
KUCOIN_API_SECRET=ваш_kucoin_api_secret
KUCOIN_API_PASSPHRASE=ваш_kucoin_api_passphrase
TELEGRAM_BOT_TOKEN=ваш_telegram_bot_token
TELEGRAM_CHAT_ID=ваш_telegram_chat_id
REDIS_URL=redis://amvera-<username>-run-<redis-project>:6379
REDIS_PASSWORD=ваш_redis_пароль
FRONTEND_URL=https://ваш-frontend.amvera.io
PORT=80
NODE_ENV=production
```

#### Frontend переменные (Node.js Browser):
```
VITE_API_URL=https://ваш-backend.amvera.io
```

#### Redis переменные (если используется внешний Redis):
```
REDIS_PASSWORD=ваш_redis_пароль
```

### 3. Получение API ключей KuCoin
1. Зайдите в аккаунт KuCoin
2. Перейдите в раздел API Keys
3. Создайте новый API ключ с правами:
   - Trade (для создания/отмены ордеров)
   - Read Info (для чтения баланса и ордеров)
4. Сохраните API Key, Secret и Passphrase

### 4. Создание Telegram бота
1. Напишите [@BotFather](https://t.me/botfather) в Telegram
2. Используйте команды:
   ```
   /newbot
   KuCoin Trading Bot  # имя бота
   @kucoin_trading_bot  # username бота
   ```
3. Сохраните токен бота

## Развертывание Redis

### ✅ Redis доступен в Amvera Cloud!

#### 1. Создание Redis сервиса
1. В панели Amvera нажмите "Создать сервис"
2. Выберите "Redis" как тип сервиса
3. Укажите имя сервиса (например, "redis")
4. Выберите тарифный план (Начальный или выше)
5. **persistenceMount**: `/data` (обязательно для сохранения данных)
6. **REDIS_ARGS**: `--requirepass ваш_пароль` (обязательно!)

#### 2. Получение Redis URL
После создания сервиса Redis, URL будет доступен в настройках сервиса в формате:
`redis://amvera-<username>-run-<redis-project>:6379`

#### 3. Настройка переменных окружения
В backend сервисе добавьте:
```
REDIS_URL=redis://amvera-<username>-run-<redis-project>:6379
REDIS_PASSWORD=ваш_пароль
```

## Развертывание Backend

### 1. Загрузка кода
1. В панели Amvera создайте новый сервис
2. Выберите "Node.js Server" как тип
3. Загрузите код из папки `backend/`
4. Или подключите GitHub репозиторий

### 2. Конфигурация сборки
Amvera автоматически прочитает `amvera.yaml`:

```yaml
build:
  type: node
  nodeVersion: '20'
  buildCommand: npm run build
  installCommand: npm install

run:
  type: node
  nodeVersion: '20'
  runCommand: npm start
  port: 80

env:
  - name: NODE_ENV
    value: production
```

### 3. Настройка переменных окружения
В разделе "Переменные окружения" добавьте все необходимые переменные.

### 4. Запуск
1. Нажмите "Собрать и запустить"
2. Дождитесь завершения сборки
3. Проверьте логи на наличие ошибок

## Развертывание Frontend

### 1. Создание сервиса
1. Создайте новый сервис в Amvera
2. Выберите "Node.js Browser" как тип
3. Загрузите код из папки `frontend/`

### 2. Конфигурация
Amvera использует `frontend/amvera.yaml`:

```yaml
build:
  type: node
  nodeVersion: '20'
  buildCommand: npm run build
  installCommand: npm install

run:
  type: node
  nodeVersion: '20'
  runCommand: npm run preview
  port: 80

env:
  - name: NODE_ENV
    value: production
```

### 3. Настройка переменных
Добавьте переменную `VITE_API_URL` с URL вашего backend сервиса.

### 4. Запуск
Аналогично backend - соберите и запустите сервис.

## Проверка развертывания

### 1. Backend API
Проверьте доступность API:
```bash
curl https://ваш-backend.amvera.io/api/kucoin/balance
```

### 2. Frontend
Откройте браузер и перейдите на URL frontend сервиса.

### 3. Telegram бот
1. Найдите бота в Telegram
2. Отправьте `/start`
3. Протестируйте команды `/balance`, `/help`

## Мониторинг и поддержка

### Логи
- Просматривайте логи в панели Amvera
- Настраивайте алерты на ошибки
- Мониторьте использование ресурсов

### Обновления
1. Внесите изменения в код
2. Закоммитьте и запушьте в GitHub
3. Amvera автоматически пересоберет сервисы

### Резервное копирование
- Данные пользователей хранятся в KuCoin
- Redis данные можно бэкапить через Amvera
- Настраивайте регулярные бэкапы

## Устранение неполадок

### Backend не запускается
1. Проверьте логи сборки
2. Убедитесь в корректности переменных окружения
3. Проверьте подключение к Redis

### Frontend не загружается
1. Проверьте сборку (npm run build)
2. Убедитесь в правильности VITE_API_URL
3. Проверьте CORS настройки backend

### Бот не отвечает
1. Проверьте токен Telegram бота
2. Убедитесь, что webhook URL настроен
3. Проверьте логи backend на ошибки

### Проблемы с KuCoin API
1. Проверьте API ключи
2. Убедитесь в правах доступа
3. Проверьте лимиты API

## Производительность

### Оптимизации
- Используйте Redis для кэширования
- Настройте rate limiting
- Мониторьте использование памяти

### Масштабирование
- Amvera поддерживает горизонтальное масштабирование
- Настройте несколько инстансов при необходимости
- Используйте CDN для статических файлов

## Безопасность

### Рекомендации
- Регулярно обновляйте API ключи
- Используйте HTTPS (Amvera предоставляет автоматически)
- Настройте firewall правила
- Мониторьте логи на подозрительную активность

### Аудит
- Ведите логи всех операций
- Настройте алерты на важные события
- Регулярно проверяйте безопасность

## Стоимость

### Тарифы Amvera
- **Free**: Ограниченное использование
- **Starter**: Для небольших проектов
- **Pro**: Для production использования

### Расчет стоимости
- Backend: ~500-1000 руб/месяц
- Frontend: ~300-500 руб/месяц
- Redis: ~200-400 руб/месяц

## Поддержка

При возникновении проблем:
1. Проверьте документацию Amvera
2. Изучите логи приложений
3. Свяжитесь с поддержкой Amvera
4. Создайте issue в репозитории проекта