import { KuCoinService } from '../services/kucoin.service';
import { addTradeJob } from '../queues/trading.queue';
import { BaseStrategy, OHLCVData } from '../strategies/base.strategy';
import { EmaMlStrategy, EmaMlConfig } from '../strategies/ema-ml.strategy';
import { MacdRsiStrategy, MacdRsiConfig } from '../strategies/macd-rsi.strategy';
import { PriceActionStrategy, PriceActionConfig } from '../strategies/price-action.strategy';
import { BollingerBandsConfig, BollingerBandsStrategy } from '../strategies/bollinger.strategy';
import * as Metrics from '../metrics';

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
  strategyConfig: EmaMlConfig | PriceActionConfig | MacdRsiConfig | BollingerBandsConfig;
}

interface Position {
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  entryPrice: number;
  timestamp: number;
}

/**
 * Represents a single trade.
 */
export interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  profit: number; // Profit or loss from the trade
  timestamp: Date;
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
    const { strategy, strategyConfig, symbols } = this.config;

    switch (strategy) {
      case 'ema-ml':
        this.strategy = new EmaMlStrategy(strategyConfig as EmaMlConfig);
        break;
      case 'macd-rsi':
        this.strategy = new MacdRsiStrategy(strategyConfig as MacdRsiConfig);
        break;
      case 'price-action':
        this.strategy = new PriceActionStrategy(strategyConfig as PriceActionConfig);
        break;
      case 'bollinger':
        this.strategy = new BollingerBandsStrategy(strategyConfig as BollingerBandsConfig);
        break;
      default:
        console.warn('Unknown strategy:', strategy);
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
    const { dailyLoss, consecutiveLosses } = this.riskManager;
    const { maxDailyLoss, maxConsecutiveLosses } = this.config;

    // Check daily loss limit
    if (dailyLoss <= -maxDailyLoss) {
      console.warn('Daily loss limit reached. Stopping trading.');
      this.isRunning = false;
      return false;
    }

    // Check consecutive losses limit
    if (consecutiveLosses >= maxConsecutiveLosses) {
      console.warn('Consecutive losses limit reached. Stopping trading.');
      this.isRunning = false;
      return false;
    }

    return true;
  }

  private updateRiskStats(profit: number): void {
    this.dailyStats.totalProfit += profit;
    this.riskManager.dailyLoss += profit;

    if (profit > 0) {
      this.riskManager.consecutiveLosses = 0;
      this.riskManager.lastTradeResult = true;
    } else {
      this.riskManager.consecutiveLosses += 1;
      this.riskManager.lastTradeResult = false;
    }
  }

  private async executeTrade(symbol: string, side: 'buy' | 'sell', amount: number): Promise<void> {
    if (this.config.demoMode) {
      console.log(`Demo trade executed: ${side} ${amount} ${symbol}`);
      const price = this.marketData[this.marketData.length - 1]?.close || 0;
      const profit = side === 'buy' ? -price * amount : price * amount;
      this.updateRiskStats(profit);
      return;
    }

    // Реальная торговля
    try {
      const result = await this.kucoinService.placeOrder(symbol, side, amount);
      console.log(`Trade executed: ${side} ${amount} ${symbol}`, result);
    } catch (error) {
      console.error('Failed to execute trade:', error);
    }
  }

  private calculateTradeProfit(): number {
    // Placeholder logic for calculating trade profit
    // Replace with actual implementation
    return Math.random() * 100 - 50; // Simulated profit/loss
  }

  private logTradingMetrics(trades: Trade[], initialBalance: number): void {
    const totalTrades = Metrics.calculateTotalTrades(trades);
    const winRate = Metrics.calculateWinRate(trades);
    const profitFactor = Metrics.calculateProfitFactor(trades);
    const totalProfit = Metrics.calculateTotalProfit(trades, initialBalance);
    const maxDrawdown = Metrics.calculateMaxDrawdown(trades);
    const bestAndWorst = Metrics.calculateBestAndWorstTrades(trades);
    const averageProfitAndLoss = Metrics.calculateAverageProfitAndLoss(trades);
    const streaks = Metrics.calculateStreaks(trades);

    console.log('--- Trading Metrics ---');
    console.log(`Total Trades: ${totalTrades}`);
    console.log(`Win Rate: ${winRate.toFixed(2)}%`);
    console.log(`Profit Factor: ${profitFactor.toFixed(2)}`);
    console.log(`Total Profit: ${totalProfit.usdt.toFixed(2)} USDT (${totalProfit.percentage.toFixed(2)}%)`);
    console.log(`Max Drawdown: ${maxDrawdown.toFixed(2)} USDT`);
    console.log(`Best Trade: ${bestAndWorst.best?.profit.toFixed(2) || 'N/A'} USDT`);
    console.log(`Worst Trade: ${bestAndWorst.worst?.profit.toFixed(2) || 'N/A'} USDT`);
    console.log(`Average Profit: ${averageProfitAndLoss.averageProfit.toFixed(2)} USDT`);
    console.log(`Average Loss: ${averageProfitAndLoss.averageLoss.toFixed(2)} USDT`);
    console.log(`Winning Streak: ${streaks.winningStreak}`);
    console.log(`Losing Streak: ${streaks.losingStreak}`);
    console.log('-----------------------');
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