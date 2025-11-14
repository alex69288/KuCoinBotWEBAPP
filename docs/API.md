# API Документация KuCoin Trading Bot

## Обзор

REST API для взаимодействия с KuCoin биржей через трейдингового бота.

Базовый URL: `http://localhost:3001/api`

## Аутентификация

API использует переменные окружения для аутентификации с KuCoin. Убедитесь, что установлены:
- `KUCOIN_API_KEY`
- `KUCOIN_API_SECRET`
- `KUCOIN_API_PASSPHRASE`

## Endpoints

### Получение баланса

**GET** `/kucoin/balance`

Получить текущий баланс аккаунта KuCoin.

**Ответ:**
```json
{
  "BTC": {
    "free": 1.0,
    "used": 0.5,
    "total": 1.5
  },
  "USDT": {
    "free": 1000.0,
    "used": 0.0,
    "total": 1000.0
  }
}
```

### Получение тикера

**GET** `/kucoin/ticker/:symbol`

Получить текущую цену и статистику для торговой пары.

**Параметры:**
- `symbol` (string): Торговый символ (например, "BTC/USDT")

**Ответ:**
```json
{
  "symbol": "BTC/USDT",
  "last": 50000.0,
  "bid": 49950.0,
  "ask": 50050.0,
  "high": 51000.0,
  "low": 49000.0,
  "volume": 150.5,
  "timestamp": 1640995200000
}
```

### Получение книги ордеров

**GET** `/kucoin/orderbook/:symbol`

Получить книгу ордеров (bid/ask) для торговой пары.

**Параметры:**
- `symbol` (string): Торговый символ
- `limit` (number, optional): Количество уровней (по умолчанию 20)

**Ответ:**
```json
{
  "bids": [
    [49950.0, 1.5],
    [49900.0, 2.0]
  ],
  "asks": [
    [50050.0, 1.2],
    [50100.0, 0.8]
  ],
  "timestamp": 1640995200000
}
```

### Создание ордера

**POST** `/kucoin/order`

Создать новый торговый ордер.

**Тело запроса:**
```json
{
  "symbol": "BTC/USDT",
  "type": "limit",
  "side": "buy",
  "amount": 0.001,
  "price": 50000.0
}
```

**Поля:**
- `symbol` (string): Торговый символ
- `type` (string): Тип ордера ("limit" или "market")
- `side` (string): Сторона ("buy" или "sell")
- `amount` (number): Количество
- `price` (number): Цена (только для limit ордеров)

**Ответ:**
```json
{
  "id": "1234567890",
  "status": "open",
  "symbol": "BTC/USDT",
  "type": "limit",
  "side": "buy",
  "amount": 0.001,
  "price": 50000.0,
  "timestamp": 1640995200000
}
```

### Получение открытых ордеров

**GET** `/kucoin/orders/open`

Получить список всех открытых ордеров.

**Параметры:**
- `symbol` (string, optional): Фильтр по символу

**Ответ:**
```json
[
  {
    "id": "1234567890",
    "symbol": "BTC/USDT",
    "type": "limit",
    "side": "buy",
    "amount": 0.001,
    "price": 50000.0,
    "status": "open",
    "timestamp": 1640995200000
  }
]
```

### Отмена ордера

**DELETE** `/kucoin/order/:orderId`

Отменить открытый ордер.

**Параметры:**
- `orderId` (string): ID ордера для отмены
- `symbol` (string, optional): Символ ордера

**Ответ:**
```json
{
  "id": "1234567890",
  "status": "canceled",
  "symbol": "BTC/USDT"
}
```

### Получение списка рынков

**GET** `/kucoin/markets`

Получить список всех доступных торговых пар.

**Ответ:**
```json
[
  {
    "id": "BTC-USDT",
    "symbol": "BTC/USDT",
    "base": "BTC",
    "quote": "USDT",
    "active": true,
    "precision": {
      "amount": 6,
      "price": 2
    },
    "limits": {
      "amount": {
        "min": 0.000001,
        "max": 100
      },
      "price": {
        "min": 0.01,
        "max": 1000000
      }
    }
  }
]
```

### Получение истории ордеров

**GET** `/kucoin/orders/history`

Получить историю закрытых ордеров.

**Параметры:**
- `symbol` (string, optional): Фильтр по символу
- `limit` (number, optional): Максимальное количество ордеров (по умолчанию 50)

**Ответ:**
```json
[
  {
    "id": "1234567890",
    "symbol": "BTC/USDT",
    "type": "limit",
    "side": "buy",
    "amount": 0.001,
    "price": 50000.0,
    "status": "filled",
    "timestamp": 1640995200000,
    "filled": 0.001,
    "cost": 50.0
  }
]
```

### Получение истории сделок

**GET** `/kucoin/trades`

Получить историю выполненных сделок.

**Параметры:**
- `symbol` (string, optional): Фильтр по символу
- `limit` (number, optional): Максимальное количество сделок (по умолчанию 50)

**Ответ:**
```json
[
  {
    "id": "trade123456",
    "symbol": "BTC/USDT",
    "side": "buy",
    "amount": 0.001,
    "price": 50000.0,
    "timestamp": 1640995200000,
    "fee": {
      "cost": 0.0005,
      "currency": "BTC"
    }
  }
]
```
```

## WebSocket

API поддерживает WebSocket соединения для реал-тайм обновлений.

**URL:** `ws://localhost:3001`

### События

#### balance:update
Обновление баланса аккаунта.

```json
{
  "type": "balance:update",
  "data": {
    "BTC": { "free": 1.0, "used": 0.5, "total": 1.5 }
  }
}
```

#### ticker:update
Обновление цены для символа.

```json
{
  "type": "ticker:update",
  "symbol": "BTC/USDT",
  "data": {
    "last": 50000.0,
    "bid": 49950.0,
    "ask": 50050.0
  }
}
```

#### order:created
Новый ордер создан.

```json
{
  "type": "order:created",
  "data": {
    "id": "1234567890",
    "status": "open",
    "symbol": "BTC/USDT"
  }
}
```

#### order:filled
Ордер выполнен.

```json
{
  "type": "order:filled",
  "data": {
    "id": "1234567890",
    "status": "filled",
    "symbol": "BTC/USDT",
    "amount": 0.001,
    "price": 50000.0
  }
}
```

## Обработка ошибок

Все ошибки возвращаются в формате:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Описание ошибки",
    "details": {}
  }
}
```

### Коды ошибок

- `KUCOIN_API_ERROR`: Ошибка KuCoin API
- `INVALID_PARAMS`: Некорректные параметры запроса
- `ORDER_FAILED`: Не удалось создать ордер
- `INSUFFICIENT_FUNDS`: Недостаточно средств
- `INVALID_SYMBOL`: Некорректный торговый символ

## Ограничения

- **Rate Limits**: Соблюдайте ограничения KuCoin API
- **Sandbox**: Для тестирования используйте sandbox режим
- **API Keys**: Храните ключи в безопасном месте
- **Validation**: Все входные данные валидируются

## Примеры использования

### JavaScript (Frontend)

```javascript
// Получение баланса
const balance = await fetch('/api/kucoin/balance')
  .then(res => res.json());

// Создание ордера
const order = await fetch('/api/kucoin/order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    symbol: 'BTC/USDT',
    type: 'limit',
    side: 'buy',
    amount: 0.001,
    price: 50000
  })
}).then(res => res.json());
```

### Python

```python
import requests

# Получение баланса
response = requests.get('http://localhost:3001/api/kucoin/balance')
balance = response.json()

# Создание ордера
order_data = {
    'symbol': 'BTC/USDT',
    'type': 'limit',
    'side': 'buy',
    'amount': 0.001,
    'price': 50000
}
response = requests.post('http://localhost:3001/api/kucoin/order', json=order_data)
order = response.json()
```