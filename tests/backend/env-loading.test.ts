describe('Environment loading and KuCoinService credentials', () => {
  beforeEach(() => {
    // Reset environment
    delete process.env.KUCOIN_API_KEY;
    delete process.env.KUCOIN_API_SECRET;
    delete process.env.KUCOIN_API_PASSPHRASE;
    jest.resetModules();
  });

  it('loads env and provides KuCoin credentials from env', async () => {
    process.env.KUCOIN_API_KEY = 'test-api-key';
    process.env.KUCOIN_API_SECRET = 'test-secret';
    process.env.KUCOIN_API_PASSPHRASE = 'test-passphrase';

    const spyLog = jest.spyOn(console, 'log').mockImplementation(() => { });
    const { kucoinService } = await import('../../backend/src/services/kucoin.service.js');
    const inst = kucoinService();

    // The service logs whether credentials are available
    const logged = spyLog.mock.calls.flat().join(' ');
    expect(logged).toEqual(expect.stringContaining('Credentials available: Yes'));

    spyLog.mockRestore();
  });
});
