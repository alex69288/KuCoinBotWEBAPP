const { KuCoinService } = require('../backend/src/services/kucoin.service');

describe('KuCoin Service Tests', () => {
  let kucoinService;

  beforeAll(() => {
    kucoinService = new KuCoinService();
  });

  test('KuCoinService instance created', () => {
    expect(kucoinService).toBeDefined();
    expect(typeof kucoinService.getBalance).toBe('function');
    expect(typeof kucoinService.getTicker).toBe('function');
    expect(typeof kucoinService.createOrder).toBe('function');
  });

  // Note: Integration tests with real API require valid credentials
  // These tests are skipped in CI/CD without proper environment setup
  test.skip('Get ticker (requires API credentials)', async () => {
    const ticker = await kucoinService.getTicker('BTC/USDT');
    expect(ticker).toBeDefined();
    expect(ticker.symbol).toBe('BTC/USDT');
  });
});