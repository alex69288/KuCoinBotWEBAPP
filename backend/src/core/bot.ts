import { KuCoinService } from '../services/kucoin.service';
import { addTradeJob } from '../queues/trading.queue';
import { BaseStrategy, OHLCVData } from '../strategies/base.strategy';
import { EmaMlStrategy, EmaMlConfig } from '../strategies/ema-ml.strategy';
import { MacdRsiStrategy, MacdRsiConfig } from '../strategies/macd-rsi.strategy';
import { PriceActionStrategy, PriceActionConfig } from '../strategies/price-action.strategy';

interface BotConfig {
  enabled: boolean;
  demoMode: boolean;
  maxDailyLoss: number; // в %
  maxConsecutiveLosses: number;
  positionSizePercent: number; // % от баланса
  telegramToken: string;
  telegramChatId: string;
  symbols: string[];
  strategy: 'ema-ml' | 'price-action' | 'macd-rsi' | 'bollinger';
  strategyConfig: any;
}

interface Position {
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  entryPrice: number;
  timestamp: number;
}

export class KuCoinBot {
  private kucoinService: KuCoinService;
  private config: BotConfig;
  private isRunning: boolean = false;
  private positions: Position[] = [];
  private dailyStats = {
    startBalance: 0,
    currentBalance: 0,
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    totalProfit: 0,
    maxDrawdown: 0,
  };
  private riskManager = {
    dailyLoss: 0,
    consecutiveLosses: 0,
    lastTradeResult: null as boolean | null,
  };
  private strategy: BaseStrategy | null = null;
  private marketData: OHLCVData[] = [];

  private static instance: KuCoinBot | null = null;

  constructor(config: BotConfig) {
    this.config = config;
    this.kucoinService = new KuCoinService();
    this.initializeStrategy();
  }

  static getInstance(config?: BotConfig): KuCoinBot {
    if (!KuCoinBot.instance) {
      if (!config) {
        throw new Error('Bot config required for first initialization');
      }
      KuCoinBot.instance = new KuCoinBot(config);
    }
    return KuCoinBot.instance;
  }

  private initializeStrategy(): void {
    switch (this.config.strategy) {
      case 'ema-ml':
        this.strategy = new EmaMlStrategy({
          symbol: this.config.symbols[0],
          ...this.config.strategyConfig
        });
        break;
      case 'macd-rsi':
        this.strategy = new MacdRsiStrategy({
          symbol: this.config.symbols[0],
          ...this.config.strategyConfig
        });
        break;
      case 'price-action':
        this.strategy = new PriceActionStrategy({
          symbol: this.config.symbols[0],
          ...this.config.strategyConfig
        });
        break;
      // Add other strategies here
      default:
        console.warn('Unknown strategy:', this.config.strategy);
    }
  }

  private async updateMarketData(): Promise<void> {
    try {
      // Get OHLCV data for the symbol (simplified, in real implementation use proper timeframe)
      const ticker = await this.kucoinService.getTicker(this.config.symbols[0]);
      const orderBook = await this.kucoinService.getOrderBook(this.config.symbols[0], 20);

      // Create OHLCV data point (simplified)
      const dataPoint: OHLCVData = {
        timestamp: Date.now(),
        open: ticker.last || 0,
        high: ticker.last || 0,
        low: ticker.last || 0,
        close: ticker.last || 0,
        volume: ticker.baseVolume || 0
      };

      this.marketData.push(dataPoint);

      // Keep only last 100 data points
      if (this.marketData.length > 100) {
        this.marketData = this.marketData.slice(-100);
      }
    } catch (error) {
      console.error('Failed to update market data:', error);
    }
  }

  private calculatePositionSize(): number {
    const balance = this.dailyStats.currentBalance;
    const positionSize = balance * (this.config.positionSizePercent / 100);
    const currentPrice = this.marketData[this.marketData.length - 1]?.close || 0;

    if (currentPrice === 0) return 0;

    return positionSize / currentPrice;
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('🤖 KuCoin Bot started');

    // Инициализация баланса
    try {
      const balance = await this.kucoinService.getBalance();
      this.dailyStats.startBalance = balance.total.USDT || 0;
      this.dailyStats.currentBalance = this.dailyStats.startBalance;
    } catch (error) {
      console.error('Failed to initialize balance:', error);
    }

    // Train ML model with historical data
    await this.trainMLModel();

    // Основной цикл (пока заглушка, будет расширен стратегиями)
    this.runMainLoop();
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    console.log('🤖 KuCoin Bot stopped');
  }

  private async runMainLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        // Проверка рисков
        if (!this.checkRiskLimits()) {
          console.log('Risk limits exceeded, stopping trading');
          await this.stop();
          break;
        }

        // Получение рыночных данных
        await this.updateMarketData();

        // Расчет сигнала стратегии
        if (this.strategy && this.marketData.length > 0) {
          const signal = this.strategy.calculateSignal(this.marketData);

          if (signal === 'buy') {
            await this.executeTrade(this.config.symbols[0], 'buy', this.calculatePositionSize());
          } else if (signal === 'sell') {
            await this.executeTrade(this.config.symbols[0], 'sell', this.positions.length > 0 ? this.positions[0].amount : 0);
          }
        }

        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 сек
      } catch (error) {
        console.error('Error in main loop:', error);
      }
    }
  }

  private async trainMLModel(): Promise<void> {
    try {
      // Get historical data for training (last 500 candles, 1h timeframe)
      const historicalData = await this.kucoinService.getHistoricalData(this.config.symbols[0], '1h', 500);

      if (this.strategy && 'mlPredictor' in this.strategy) {
        (this.strategy as any).mlPredictor.train(historicalData);
      }
    } catch (error) {
      console.error('Failed to train ML model:', error);
    }
  }

  private checkRiskLimits(): boolean {
    // Дневной лимит потерь
    if (this.riskManager.dailyLoss >= this.config.maxDailyLoss) {
      return false;
    }

    // Серия убытков
    if (this.riskManager.consecutiveLosses >= this.config.maxConsecutiveLosses) {
      return false;
    }

    return true;
  }

  async executeTrade(symbol: string, side: 'buy' | 'sell', amount: number, price?: number): Promise<void> {
    if (!this.config.enabled || this.config.demoMode) {
      console.log(`Demo trade: ${side} ${amount} ${symbol} at ${price}`);
      return;
    }

    try {
      const job = await addTradeJob({
        symbol,
        type: price ? 'limit' : 'market',
        side,
        amount,
        price,
        userId: 'bot',
      });

      // Обновление позиции
      this.positions.push({
        symbol,
        side,
        amount,
        entryPrice: price || 0,
        timestamp: Date.now(),
      });

      console.log(`Trade executed: ${job.id}`);
    } catch (error) {
      console.error('Failed to execute trade:', error);
    }
  }

  getStatus(): any {
    return {
      isRunning: this.isRunning,
      config: this.config,
      positions: this.positions,
      stats: this.dailyStats,
      risks: this.riskManager,
    };
  }

  getConfig(): BotConfig {
    return this.config;
  }

  getStats(): any {
    return this.dailyStats;
  }

  async manualTrade(symbol: string, side: 'buy' | 'sell', amount: number, type: 'market' | 'limit' = 'market', price?: number): Promise<any> {
    if (!this.isRunning && !this.config.demoMode) {
      throw new Error('Bot is not running');
    }

    try {
      const job = await addTradeJob({
        symbol,
        type,
        side,
        amount,
        price,
        userId: 'manual',
      });

      return {
        jobId: job.id,
        status: 'queued',
        message: 'Trade queued successfully'
      };
    } catch (error) {
      console.error('Failed to execute manual trade:', error);
      throw error;
    }
  }

  updateConfig(newConfig: Partial<BotConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}