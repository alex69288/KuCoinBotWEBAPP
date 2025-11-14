import { KuCoinService } from '../services/kucoin.service.js';
import { addTradeJob } from '../queues/trading.queue.js';

interface BotConfig {
  enabled: boolean;
  demoMode: boolean;
  maxDailyLoss: number; // в %
  maxConsecutiveLosses: number;
  positionSizePercent: number; // % от баланса
  telegramToken: string;
  telegramChatId: string;
  symbols: string[];
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

  constructor(config: BotConfig) {
    this.config = config;
    this.kucoinService = new KuCoinService();
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

        // Здесь будет логика стратегий и сигналов
        // Пока заглушка

        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 сек
      } catch (error) {
        console.error('Error in main loop:', error);
      }
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

  updateConfig(newConfig: Partial<BotConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}