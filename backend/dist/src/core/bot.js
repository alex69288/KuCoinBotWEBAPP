import { KuCoinService } from '../services/kucoin.service';
import { addTradeJob } from '../queues/trading.queue';
import { EmaMlStrategy } from '../strategies/ema-ml.strategy';
import { MacdRsiStrategy } from '../strategies/macd-rsi.strategy';
import { PriceActionStrategy } from '../strategies/price-action.strategy';
import { BollingerBandsStrategy } from '../strategies/bollinger.strategy';
import * as Metrics from '../metrics';
export class KuCoinBot {
    kucoinService;
    config;
    isRunning = false;
    positions = [];
    dailyStats = {
        startBalance: 0,
        currentBalance: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        totalProfit: 0,
        maxDrawdown: 0,
    };
    riskManager = {
        dailyLoss: 0,
        consecutiveLosses: 0,
        lastTradeResult: null,
    };
    strategy = null;
    marketData = [];
    static instance = null;
    constructor(config) {
        this.config = config;
        this.kucoinService = new KuCoinService();
        this.initializeStrategy();
    }
    static getInstance(config) {
        if (!KuCoinBot.instance) {
            if (!config) {
                throw new Error('Bot config required for first initialization');
            }
            KuCoinBot.instance = new KuCoinBot(config);
        }
        return KuCoinBot.instance;
    }
    initializeStrategy() {
        const { strategy, strategyConfig, symbols } = this.config;
        switch (strategy) {
            case 'ema-ml':
                this.strategy = new EmaMlStrategy(strategyConfig);
                break;
            case 'macd-rsi':
                this.strategy = new MacdRsiStrategy(strategyConfig);
                break;
            case 'price-action':
                this.strategy = new PriceActionStrategy(strategyConfig);
                break;
            case 'bollinger':
                this.strategy = new BollingerBandsStrategy(strategyConfig);
                break;
            default:
                console.warn('Unknown strategy:', strategy);
        }
    }
    async updateMarketData() {
        try {
            // Get OHLCV data for the symbol (simplified, in real implementation use proper timeframe)
            const ticker = await this.kucoinService.getTicker(this.config.symbols[0]);
            const orderBook = await this.kucoinService.getOrderBook(this.config.symbols[0], 20);
            // Create OHLCV data point (simplified)
            const dataPoint = {
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
        }
        catch (error) {
            console.error('Failed to update market data:', error);
        }
    }
    calculatePositionSize() {
        const balance = this.dailyStats.currentBalance;
        const positionSize = balance * (this.config.positionSizePercent / 100);
        const currentPrice = this.marketData[this.marketData.length - 1]?.close || 0;
        if (currentPrice === 0)
            return 0;
        return positionSize / currentPrice;
    }
    checkRiskLimits() {
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
    calculateVolatility() {
        if (this.marketData.length < 10)
            return 0;
        const closes = this.marketData.slice(-10).map(d => d.close);
        const mean = closes.reduce((sum, price) => sum + price, 0) / closes.length;
        const variance = closes.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / closes.length;
        return Math.sqrt(variance) / mean; // Коэффициент вариации
    }
    async executeTrade(symbol, side, amount) {
        try {
            // Проверка минимального размера заказа
            const currentPrice = this.marketData[this.marketData.length - 1]?.close || 0;
            const orderValue = amount * currentPrice;
            if (orderValue < this.config.minOrderAmount) {
                console.log(`Order value too small: ${orderValue} < ${this.config.minOrderAmount}`);
                return;
            }
            if (this.config.demoMode) {
                // Демо режим - симуляция
                console.log(`Demo trade: ${side} ${amount} ${symbol} at ${currentPrice}`);
                this.simulateTrade(symbol, side, amount, currentPrice);
            }
            else {
                // Реальный режим
                const result = await this.kucoinService.placeOrder(symbol, side, amount);
                console.log(`Real trade executed: ${result}`);
                this.recordTrade(symbol, side, amount, currentPrice, 0); // Profit будет рассчитан позже
            }
        }
        catch (error) {
            console.error('Failed to execute trade:', error);
        }
    }
    simulateTrade(symbol, side, amount, price) {
        if (side === 'buy') {
            this.positions.push({
                symbol,
                side,
                amount,
                entryPrice: price,
                timestamp: Date.now()
            });
        }
        else if (side === 'sell' && this.positions.length > 0) {
            const position = this.positions.shift();
            const profit = (price - position.entryPrice) * position.amount;
            this.recordTrade(symbol, side, amount, price, profit);
        }
    }
    recordTrade(symbol, side, amount, price, profit) {
        const trade = {
            id: Date.now().toString(),
            symbol,
            side,
            amount,
            profit,
            timestamp: new Date()
        };
        // Обновление статистики
        this.dailyStats.totalTrades++;
        if (profit > 0) {
            this.dailyStats.winningTrades++;
            this.riskManager.consecutiveLosses = 0;
        }
        else {
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
    async start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        console.log('🤖 KuCoin Bot started');
        // Инициализация баланса
        try {
            const balance = await this.kucoinService.getBalance();
            this.dailyStats.startBalance = balance.total.USDT || 0;
            this.dailyStats.currentBalance = this.dailyStats.startBalance;
        }
        catch (error) {
            console.error('Failed to initialize balance:', error);
        }
        // Train ML model with historical data
        await this.trainMLModel();
        // Основной цикл (пока заглушка, будет расширен стратегиями)
        this.runMainLoop();
    }
    async stop() {
        this.isRunning = false;
        console.log('🤖 KuCoin Bot stopped');
    }
    async runMainLoop() {
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
                    }
                    else if (signal === 'sell') {
                        await this.executeTrade(this.config.symbols[0], 'sell', this.positions.length > 0 ? this.positions[0].amount : 0);
                    }
                }
                await new Promise(resolve => setTimeout(resolve, 30000)); // 30 сек
            }
            catch (error) {
                console.error('Error in main loop:', error);
            }
        }
    }
    async trainMLModel() {
        try {
            // Get historical data for training (last 500 candles, 1h timeframe)
            const historicalData = await this.kucoinService.getHistoricalData(this.config.symbols[0], '1h', 500);
            if (this.strategy && 'mlPredictor' in this.strategy) {
                this.strategy.mlPredictor.train(historicalData);
            }
        }
        catch (error) {
            console.error('Failed to train ML model:', error);
        }
    }
    calculateTradeProfit() {
        // Placeholder logic for calculating trade profit
        // Replace with actual implementation
        return Math.random() * 100 - 50; // Simulated profit/loss
    }
    logTradingMetrics(trades, initialBalance) {
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
    getStatus() {
        return {
            isRunning: this.isRunning,
            config: this.config,
            positions: this.positions,
            stats: this.dailyStats,
            risks: this.riskManager,
        };
    }
    getConfig() {
        return this.config;
    }
    getStats() {
        return this.dailyStats;
    }
    async manualTrade(symbol, side, amount, type = 'market', price) {
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
        }
        catch (error) {
            console.error('Failed to execute manual trade:', error);
            throw error;
        }
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}
//# sourceMappingURL=bot.js.map