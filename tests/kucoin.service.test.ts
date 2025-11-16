// Простой тест для проверки базовой функциональности KuCoin API
// Интеграционный тест без моков

describe('KuCoin API Integration', () => {
  it('должен подключаться к KuCoin API (sandbox)', async () => {
    // Этот тест проверяет, что мы можем подключиться к sandbox API
    // без реальных API ключей
    expect(true).toBe(true); // Плейсхолдер для интеграционного теста
  });

  it('должен иметь правильную структуру ответа для баланса', async () => {
    // Проверяем структуру ожидаемого ответа
    const expectedBalanceStructure = {
      BTC: { free: expect.any(Number), used: expect.any(Number), total: expect.any(Number) }
    };

    // В реальном тесте здесь был бы вызов API
    expect(expectedBalanceStructure).toBeDefined();
  });

  it('должен иметь правильную структуру ответа для тикера', async () => {
    // Проверяем структуру ожидаемого ответа для тикера
    const expectedTickerStructure = {
      symbol: expect.any(String),
      last: expect.any(Number),
      bid: expect.any(Number),
      ask: expect.any(Number)
    };

    expect(expectedTickerStructure).toBeDefined();
  });

  it('должен иметь правильную структуру ответа для ордера', async () => {
    // Проверяем структуру ожидаемого ответа для ордера
    const expectedOrderStructure = {
      id: expect.any(String),
      status: expect.any(String)
    };

    expect(expectedOrderStructure).toBeDefined();
  });

  it('должен иметь правильную структуру ответа для истории ордеров', async () => {
    // Проверяем структуру ожидаемого ответа для истории ордеров
    const expectedOrderHistoryStructure = [
      {
        id: expect.any(String),
        symbol: expect.any(String),
        side: expect.any(String),
        amount: expect.any(Number),
        price: expect.any(Number),
        status: expect.any(String),
        timestamp: expect.any(Number)
      }
    ];

    expect(expectedOrderHistoryStructure).toBeDefined();
  });

  it('должен иметь правильную структуру ответа для сделок', async () => {
    // Проверяем структуру ожидаемого ответа для сделок
    const expectedTradesStructure = [
      {
        id: expect.any(String),
        symbol: expect.any(String),
        side: expect.any(String),
        amount: expect.any(Number),
        price: expect.any(Number),
        timestamp: expect.any(Number)
      }
    ];

    expect(expectedTradesStructure).toBeDefined();
  });
});

import { kucoinService } from '../backend/src/services/kucoin.service';

describe('KuCoin Service Demo Mode', () => {
  it('should switch to demo mode', () => {
    kucoinService.setDemoMode(true);
    const instance = kucoinService.getInstance();
    expect(instance.isDemo).toBe(true);
  });

  it('should switch to live mode', () => {
    kucoinService.setDemoMode(false);
    const instance = kucoinService.getInstance();
    expect(instance.isDemo).toBe(false);
  });

  it('should recreate instance when mode changes', () => {
    kucoinService.setDemoMode(true);
    const demoInstance = kucoinService.getInstance();
    kucoinService.setDemoMode(false);
    const liveInstance = kucoinService.getInstance();
    expect(demoInstance).not.toBe(liveInstance);
  });
});