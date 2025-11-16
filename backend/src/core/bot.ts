import { KuCoinService, kucoinService } from '../services/kucoin.service';
import { addTradeJob } from '../queues/trading.queue';
import { BaseStrategy, OHLCVData } from '../strategies/base.strategy';
import { EmaMlStrategy, EmaMlConfig } from '../strategies/ema-ml.strategy';
import { MacdRsiStrategy, MacdRsiConfig } from '../strategies/macd-rsi.strategy';
import { PriceActionStrategy, PriceActionConfig } from '../strategies/price-action.strategy';
import { BollingerBandsConfig, BollingerBandsStrategy } from '../strategies/bollinger.strategy';
import { calculateEMA } from '../indicators/ema';
import * as Metrics from '../metrics';

interface BotConfig {
  enabled: boolean;
  demoMode: boolean;
  maxDailyLoss: number; // в %
  maxConsecutiveLosses: number;
  positionSizePercent: number; // % от баланса
  volatilityLimit: number; // максимальная волатильность для торговли
  minOrderAmount: number; // минимальная сумма заказа в USDT
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
  timestamp: number;
}

export class KuCoinBot {
  private kucoinService: KuCoinService;
  private config: BotConfig;
  private isRunning: boolean = false;
  private positions: Position[] = [];
  private demoTrades: Trade[] = [];
  // Snapshot of real positions saved when switching to demo mode
  private savedPositionsSnapshot: Position[] | null = null;
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
    // Use shared singleton KuCoinService to avoid multiple instances
    this.kucoinService = kucoinService.getInstance();
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

  private calculatePositionSize(): number {
    const balance = this.dailyStats.currentBalance;
    const positionSize = balance * (this.config.positionSizePercent / 100);
    const currentPrice = this.marketData[this.marketData.length - 1]?.close || 0;

    if (currentPrice === 0) return 0;

    return positionSize / currentPrice;
  }

  private checkRiskLimits(): boolean {
    // Проверка дневного лимита потерь
    const dailyLoss = this.dailyStats.startBalance - this.dailyStats.currentBalance;
    if (dailyLoss >= this.config.maxDailyLoss) {
      console.log(`Daily loss limit exceeded: ${dailyLoss} >= ${this.config.maxDailyLoss}`);
      return false;
    }

    // Проверка серии убытков
    if (this.riskManager.consecutiveLosses >= this.config.maxConsecutiveLosses) {
      console.log(`Consecutive losses limit exceeded: ${this.riskManager.consecutiveLosses} >= ${this.config.maxConsecutiveLosses}`);
      return false;
    }

    // Проверка волатильности
    if (this.marketData.length > 10) {
      const volatility = this.calculateVolatility();
      if (volatility > this.config.volatilityLimit) {
        console.log(`Volatility too high: ${volatility} > ${this.config.volatilityLimit}`);
        return false;
      }
    }

    return true;
  }

  private calculateVolatility(): number {
    if (this.marketData.length < 10) return 0;

    const closes = this.marketData.slice(-10).map(d => d.close);
    const mean = closes.reduce((sum, price) => sum + price, 0) / closes.length;
    const variance = closes.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / closes.length;
    return Math.sqrt(variance) / mean; // Коэффициент вариации
  }

  private simulateTrade(symbol: string, side: 'buy' | 'sell', amount: number, price: number): void {
    const timestamp = Date.now();
    const id = `demo-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
    this.demoTrades.push({ id, symbol, side, amount, profit: 0, timestamp });
    console.log(`Simulated trade: ${side} ${amount} ${symbol} at ${price}`);

    if (side === 'buy') {
      // Добавить позицию
      const position: Position = {
        symbol,
        side: 'buy',
        amount,
        entryPrice: price,
        timestamp
      };
      this.positions.push(position);
      // Вычесть стоимость из баланса
      const cost = amount * price;
      this.dailyStats.currentBalance -= cost;
      console.log(`Position opened: ${amount} ${symbol} at ${price}, cost: ${cost}, new balance: ${this.dailyStats.currentBalance}`);
    } else if (side === 'sell') {
      // Найти и закрыть позицию
      const positionIndex = this.positions.findIndex(p => p.symbol === symbol && p.side === 'buy');
      if (positionIndex !== -1) {
        const position = this.positions[positionIndex];
        const profit = (price - position.entryPrice) * amount;
        this.positions.splice(positionIndex, 1);
        this.dailyStats.currentBalance += amount * price; // Вернуть стоимость продажи
        this.recordTrade(symbol, side, amount, price, profit);
        console.log(`Position closed: ${amount} ${symbol} at ${price}, profit: ${profit}, new balance: ${this.dailyStats.currentBalance}`);
      } else {
        console.log(`No open position found for ${symbol} to sell`);
      }
    }
  }

  private async executeTrade(symbol: string, side: 'buy' | 'sell', amount: number): Promise<void> {
    const currentPrice = this.marketData[this.marketData.length - 1]?.close || 0;
    if (this.config.demoMode) {
      this.simulateTrade(symbol, side, amount, currentPrice);
    } else {
      try {
        // Проверка минимального размера заказа
        const orderValue = amount * currentPrice;
        if (orderValue < this.config.minOrderAmount) {
          console.log(`Order value too small: ${orderValue} < ${this.config.minOrderAmount}`);
          return;
        }

        // Реальный режим
        const result = await this.kucoinService.placeOrder(symbol, side, amount);
        console.log(`Real trade executed: ${result}`);

        if (side === 'buy') {
          // Добавить позицию
          const position: Position = {
            symbol,
            side: 'buy',
            amount,
            entryPrice: currentPrice,
            timestamp: Date.now()
          };
          this.positions.push(position);
          // Вычесть стоимость из баланса (примерно, точный расчет позже)
          const cost = amount * currentPrice;
          this.dailyStats.currentBalance -= cost;
          this.recordTrade(symbol, side, amount, currentPrice, 0); // Profit 0 для покупки
        } else if (side === 'sell') {
          // Найти и закрыть позицию
          const positionIndex = this.positions.findIndex(p => p.symbol === symbol && p.side === 'buy');
          if (positionIndex !== -1) {
            const position = this.positions[positionIndex];
            const profit = (currentPrice - position.entryPrice) * amount;
            this.positions.splice(positionIndex, 1);
            this.dailyStats.currentBalance += amount * currentPrice; // Вернуть стоимость продажи
            this.recordTrade(symbol, side, amount, currentPrice, profit);
          } else {
            console.log(`No open position found for ${symbol} to sell`);
            this.recordTrade(symbol, side, amount, currentPrice, 0);
          }
        }
      } catch (error) {
        console.error('Failed to execute trade:', error);
      }
    }
  }

  private recordTrade(symbol: string, side: 'buy' | 'sell', amount: number, price: number, profit: number): void {
    const trade: Trade = {
      id: Date.now().toString(),
      symbol,
      side,
      amount,
      profit,
      timestamp: Date.now()
    };

    // Обновление статистики
    this.dailyStats.totalTrades++;
    if (profit > 0) {
      this.dailyStats.winningTrades++;
      this.riskManager.consecutiveLosses = 0;
    } else {
      this.dailyStats.losingTrades++;
      this.riskManager.consecutiveLosses++;
    }
    this.dailyStats.totalProfit += profit;
    this.dailyStats.currentBalance += profit;

    // Обновление максимальной просадки
    const drawdown = this.dailyStats.startBalance - this.dailyStats.currentBalance;
    if (drawdown > this.dailyStats.maxDrawdown) {
      this.dailyStats.maxDrawdown = drawdown;
    }

    console.log(`Trade recorded: ${trade.side} ${trade.amount} ${trade.symbol} profit: ${trade.profit}`);
  }

  private mainLoopInterval: NodeJS.Timeout | null = null;

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('🤖 KuCoin Bot started');

    // Инициализация баланса
    if (this.config.demoMode) {
      this.dailyStats.startBalance = 1000; // Виртуальный начальный баланс для демо
      this.dailyStats.currentBalance = this.dailyStats.startBalance;
      console.log('Demo mode: Virtual balance initialized to 1000 USDT');
    } else {
      try {
        const balance = await this.kucoinService.getBalance();
        this.dailyStats.startBalance = balance.total.USDT || 0;
        this.dailyStats.currentBalance = this.dailyStats.startBalance;
      } catch (error) {
        console.error('Failed to initialize balance:', error);
      }
    }

    // Попытаться восстановить открытые позиции из истории сделок
    try {
      const restoreResult = await this.restorePositions();
      console.log(`Positions restored: ${restoreResult?.restored || 0}`);
    } catch (error: any) {
      console.warn('Failed to restore positions on start:', (error as any)?.message || error);
    }

    // Train ML model with historical data
    await this.trainMLModel();

    // Основной цикл (пока заглушка, будет расширен стратегиями)
    this.mainLoopInterval = setInterval(() => this.runMainLoopIteration(), 30000);
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.mainLoopInterval) {
      clearInterval(this.mainLoopInterval);
      this.mainLoopInterval = null;
    }
    console.log('🤖 KuCoin Bot stopped');
  }

  private async runMainLoopIteration(): Promise<void> {
    try {
      // Проверка рисков
      if (!this.checkRiskLimits()) {
        console.log('Risk limits exceeded, stopping trading');
        await this.stop();
        return;
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
    } catch (error) {
      console.error('Error in main loop:', error);
    }
  }

  private async updateMarketData(): Promise<void> {
    try {
      const symbol = this.config.symbols[0];
      const historicalData = await this.kucoinService.getHistoricalData(symbol, '1h', 100);
      this.marketData = historicalData;
    } catch (error) {
      console.error('Failed to update market data:', error);
      // Continue with empty data
      this.marketData = [];
    }
  }

  private async trainMLModel(): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Skipping ML training in development mode');
      return;
    }
    try {
      // Get historical data for training (last 500 candles, 1h timeframe)
      const historicalData = await this.kucoinService.getHistoricalData(this.config.symbols[0], '1h', 500);

      if (this.strategy && 'mlPredictor' in this.strategy) {
        (this.strategy as any).mlPredictor.train(historicalData);
      }
    } catch (error) {
      console.error('Failed to train ML model:', error);
      console.log('Continuing without ML training');
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
      // Выполнять trade напрямую, без очереди
      await this.executeTrade(symbol, side, amount);
      return {
        status: 'executed',
        message: 'Trade executed successfully'
      };
    } catch (error) {
      console.error('Failed to execute manual trade:', error);
      throw error;
    }
  }

  updateConfig(newConfig: Partial<BotConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public async setDemoMode(enabled: boolean): Promise<void> {
    this.config.demoMode = enabled;
    // set env flag so kucoinService factory can recreate appropriate instance
    process.env.DEMO_MODE = enabled ? 'true' : 'false';
    try {
      // dynamic import for ESM environments
      let mod: any;
      try {
        mod = await import('../services/kucoin.service');
      } catch (e) {
        // Some loaders (tsx/node ESM) expect .js extension at runtime
        mod = await import('../services/kucoin.service.js');
      }

      // If enabling demo, capture current market price to seed demo service
      const symbol = this.config.symbols[0];
      let lastPrice: number | null = null;
      try {
        const ticker = await this.kucoinService.getTicker(symbol);
        if (ticker && typeof (ticker.last) === 'number') lastPrice = ticker.last;
      } catch (e) {
        // ignore
      }

      // Tell the kucoinService factory to switch mode, then get the real instance
      if (mod && typeof mod.kucoinService !== 'undefined') {
        if (typeof mod.kucoinService.setDemoMode === 'function') {
          mod.kucoinService.setDemoMode(enabled);
        }
        this.kucoinService = (typeof mod.kucoinService.getInstance === 'function')
          ? mod.kucoinService.getInstance()
          : mod.kucoinService;

        // If demo enabled and we have a lastPrice, seed the demo service
        if (enabled && lastPrice !== null && typeof this.kucoinService.setDemoSeedPrices === 'function') {
          try {
            this.kucoinService.setDemoSeedPrices({ [symbol]: lastPrice });
            console.log('Demo service seeded with current market price for', symbol, lastPrice);
          } catch (e) {
            console.warn('Failed to seed demo service prices:', e);
          }
        }
      } else {
        throw new Error('kucoinService export not found in module');
      }
      // When enabling demo: snapshot current positions and zero them for display
      if (enabled) {
        try {
          this.savedPositionsSnapshot = JSON.parse(JSON.stringify(this.positions || []));
          // Zero-out amounts so UI shows positions but with no exposure/profit
          this.positions = (this.positions || []).map(p => ({ ...p, amount: 0 }));
          console.log('Demo mode: positions snapshot saved and zeroed for display');
        } catch (e) {
          console.warn('Failed to snapshot positions on demo enable:', e);
        }
      } else {
        // Restoring positions when leaving demo mode
        if (this.savedPositionsSnapshot) {
          this.positions = this.savedPositionsSnapshot;
          this.savedPositionsSnapshot = null;
          console.log('Demo mode disabled: positions restored from snapshot');
        }
      }
      console.log(`Demo mode ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Failed to reload kucoinService after demo mode change:', error);
      throw error;
    }
  }

  public getDemoTrades(): Trade[] {
    return this.demoTrades;
  }

  public clearDemoTrades(): void {
    this.demoTrades = [];
  }

  // Add a single open position manually
  public addPosition(position: Position): void {
    if (!position) return;
    this.positions.push(position);
    console.log('Manual position added:', position);
  }

  // Restore open positions from exchange trade history (FIFO matching)
  public async restorePositions(limit: number = 500): Promise<any> {
    const symbol = this.config.symbols[0];
    try {
      const trades = await this.kucoinService.getTrades(symbol, limit);
      if (!Array.isArray(trades)) {
        return { restored: 0, positions: [] };
      }

      // Normalize and sort trades by timestamp ascending
      const normalized = trades
        .map((t: any) => ({
          timestamp: t.timestamp || t.datetime || Date.now(),
          side: (t.side || t.direction || '').toLowerCase(),
          amount: Number(t.amount || t.size || 0),
          price: Number(t.price || (t.cost && t.amount ? t.cost / t.amount : 0) || 0),
        }))
        .sort((a: any, b: any) => a.timestamp - b.timestamp);

      // Use FIFO stack of buys and consume by sells
      const buyStack: Array<{ amount: number; price: number; timestamp: number }> = [];

      for (const t of normalized) {
        if (t.side === 'buy' && t.amount > 0) {
          buyStack.push({ amount: t.amount, price: t.price, timestamp: t.timestamp });
        } else if (t.side === 'sell' && t.amount > 0) {
          let remaining = t.amount;
          while (remaining > 0 && buyStack.length > 0) {
            const head = buyStack[0];
            if (head.amount > remaining) {
              head.amount = +(head.amount - remaining).toFixed(12);
              remaining = 0;
            } else {
              remaining = +(remaining - head.amount).toFixed(12);
              buyStack.shift();
            }
          }
        }
      }

      // Build positions from remaining buy stack
      const restoredPositions: Position[] = buyStack.map(b => ({
        symbol,
        side: 'buy',
        amount: b.amount,
        entryPrice: b.price,
        timestamp: b.timestamp,
      }));

      // Merge restored positions with any existing in-memory positions (do not overwrite manual adds)
      const newPositions = restoredPositions.filter(r => !this.positions.some(p => p.symbol === r.symbol && p.entryPrice === r.entryPrice && p.amount === r.amount && p.timestamp === r.timestamp));
      this.positions = [...this.positions, ...newPositions];

      return { restored: newPositions.length, positions: this.positions };
    } catch (error) {
      console.error('Failed to restore positions:', error);
      throw error;
    }
  }

  public async getMarketUpdate(): Promise<any> {
    const symbol = this.config.symbols[0];
    const ticker = await this.kucoinService.getTicker(symbol);
    const price = ticker.last;
    // ccxt `ticker.percentage` already returns percent value (e.g. 0.2 for 0.2%) so
    // don't multiply by 100 - it leads to values like 20.00 instead of 0.20.
    const change24h = typeof ticker.percentage === 'number' ? ticker.percentage : 0;

    // EMA
    const closes = this.marketData.map(d => d.close);
    const emaFast = calculateEMA(closes, 12);
    const emaSlow = calculateEMA(closes, 26);
    let emaDirection = 'ОЖИДАНИЕ';
    let emaPercent = 0;
    if (emaFast.length > 0 && emaSlow.length > 0) {
      const fast = emaFast[emaFast.length - 1];
      const slow = emaSlow[emaSlow.length - 1];
      emaPercent = ((fast - slow) / slow) * 100;
      emaDirection = fast > slow ? 'ВВЕРХ' : 'ВНИЗ';
    }

    // Signal
    const signal = this.strategy ? this.strategy.calculateSignal(this.marketData) : 'hold';
    const signalText = signal === 'buy' ? 'ПОКУПКА' : signal === 'sell' ? 'ПРОДАЖА' : 'ОЖИДАНИЕ';

    // ML
    let mlConfidence = 0.5;
    if (this.strategy && 'mlPredictor' in this.strategy) {
      mlConfidence = (this.strategy as any).mlPredictor.predict(this.marketData);
    }
    const mlPercent = (mlConfidence * 100).toFixed(1);
    // Map numeric confidence to status strings according to specification
    // >70%: Сильный рост
    // 60-70%: Умеренный рост
    // 50-60%: Нейтрально
    // 40-50%: Умеренное падение
    // <40%: Сильное падение
    let mlText = 'НЕЙТРАЛЬНО';
    if (mlConfidence > 0.7) mlText = 'СИЛЬНЫЙ РОСТ';
    else if (mlConfidence >= 0.6) mlText = 'УМЕРЕННЫЙ РОСТ';
    else if (mlConfidence >= 0.5) mlText = 'НЕЙТРАЛЬНО';
    else if (mlConfidence >= 0.4) mlText = 'УМЕРЕННОЕ ПАДЕНИЕ';
    else mlText = 'СИЛЬНОЕ ПАДЕНИЕ';

    // Positions
    const positions = this.positions.filter(p => p.symbol === symbol);
    const openPositionsCount = positions.length;
    const positionSize = this.calculatePositionSize();
    const stakeSize = positionSize * price;
    const entryPrice = positions[0]?.entryPrice || 0;
    const tpPrice = entryPrice * (1 + (this.config.strategyConfig.takeProfitPercent || 2) / 100);
    const currentProfit = positions.length > 0 ? (price - entryPrice) * positionSize : 0;
    const profitPercent = positions.length > 0 ? ((price - entryPrice) / entryPrice) * 100 : 0;
    const toTPPercent = positions.length > 0 ? ((tpPrice - price) / price) * 100 : 0;

    // Map positions to include runtime profit/percent per position
    const positionsList = positions.map(p => {
      const profit = (price - p.entryPrice) * p.amount;
      const profitPercentSingle = p.entryPrice ? ((price - p.entryPrice) / p.entryPrice) * 100 : 0;
      return {
        symbol: p.symbol,
        side: p.side,
        amount: p.amount,
        entryPrice: p.entryPrice,
        timestamp: p.timestamp,
        profit,
        profitPercent: profitPercentSingle
      };
    });

    // Debug logging: show positions present in memory and what will be returned
    try {
      console.log('getMarketUpdate: totalPositions=', this.positions.length, 'filteredForSymbol=', positions.length);
      if (positionsList.length > 0) {
        console.log('getMarketUpdate: positionsList sample=', positionsList.slice(0, 3));
      }
    } catch (e) {
      // ignore logging errors
    }

    const change24hAmount = (price && change24h) ? price * (change24h / 100) : 0;

    return {
      symbol,
      price,
      change24h,
      change24hAmount,
      emaDirection,
      emaPercent,
      signal,
      signalText,
      mlConfidence,
      mlPercent,
      mlText,
      openPositionsCount,
      positionSize,
      stakeSize,
      entryPrice,
      tpPrice,
      currentProfit,
      profitPercent,
      toTPPercent
      ,
      positionsList
    };
  }

  // Импорт сделок из CSV-строки и восстановление позиций (FIFO)
  public async importTradesCsv(csv: string): Promise<any> {
    try {
      if (!csv || typeof csv !== 'string') return { restored: 0, positions: [] };

      const lines = csv.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length <= 1) return { restored: 0, positions: [] };

      const header = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1);

      const trades = rows.map(r => {
        const cols = r.split(',');
        const obj: any = {};
        for (let i = 0; i < Math.min(cols.length, header.length); i++) {
          obj[header[i]] = cols[i];
        }
        return obj;
      }).filter(t => t.symbol && t.side && t.size);

      const normalized = trades.map((t: any) => {
        const ts = t.tradeCreatedAt ? new Date(t.tradeCreatedAt).getTime() : Date.now();
        const side = (t.side || '').toLowerCase();
        const amount = Number((t.size || t.amount || 0));
        const price = Number(t.price || 0);
        const symbolRaw = (t.symbol || '').trim();
        const symbol = symbolRaw.includes('-') ? symbolRaw.replace('-', '/') : symbolRaw;
        return { timestamp: ts, side, amount, price, symbol };
      }).sort((a: any, b: any) => a.timestamp - b.timestamp);

      // For now operate on the bot's configured symbol only
      const targetSymbol = this.config.symbols[0];
      const relevant = normalized.filter((t: any) => t.symbol === targetSymbol || t.symbol === targetSymbol.replace('/', '-'));

      const buyStack: Array<{ amount: number; price: number; timestamp: number }> = [];

      for (const t of relevant) {
        if (t.side === 'buy' && t.amount > 0) {
          buyStack.push({ amount: t.amount, price: t.price, timestamp: t.timestamp });
        } else if (t.side === 'sell' && t.amount > 0) {
          let remaining = t.amount;
          while (remaining > 0 && buyStack.length > 0) {
            const head = buyStack[0];
            if (head.amount > remaining) {
              head.amount = +(head.amount - remaining).toFixed(12);
              remaining = 0;
            } else {
              remaining = +(remaining - head.amount).toFixed(12);
              buyStack.shift();
            }
          }
        }
      }

      this.positions = buyStack.map(b => ({ symbol: targetSymbol, side: 'buy', amount: b.amount, entryPrice: b.price, timestamp: b.timestamp }));

      return { restored: this.positions.length, positions: this.positions };
    } catch (error) {
      console.error('Failed to import trades CSV:', error);
      throw error;
    }
  }
}