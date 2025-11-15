import { KuCoinService } from '../services/kucoin.service';
import { EmaMlStrategy } from '../strategies/ema-ml.strategy';
import { MacdRsiStrategy } from '../strategies/macd-rsi.strategy';
import { PriceActionStrategy } from '../strategies/price-action.strategy';
import { BollingerBandsStrategy } from '../strategies/bollinger.strategy';
import { calculateEMA } from '../indicators/ema';
import * as Metrics from '../metrics';
export class KuCoinBot {
    kucoinService;
    config;
    isRunning = false;
    positions = [];
    demoTrades = [];
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
    simulateTrade(symbol, side, amount, price) {
        const timestamp = Date.now();
        const id = `demo-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
        this.demoTrades.push({ id, symbol, side, amount, profit: 0, timestamp });
        console.log(`Simulated trade: ${side} ${amount} ${symbol} at ${price}`);
        if (side === 'buy') {
            // Добавить позицию
            const position = {
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
        }
        else if (side === 'sell') {
            // Найти и закрыть позицию
            const positionIndex = this.positions.findIndex(p => p.symbol === symbol && p.side === 'buy');
            if (positionIndex !== -1) {
                const position = this.positions[positionIndex];
                const profit = (price - position.entryPrice) * amount;
                this.positions.splice(positionIndex, 1);
                this.dailyStats.currentBalance += amount * price; // Вернуть стоимость продажи
                this.recordTrade(symbol, side, amount, price, profit);
                console.log(`Position closed: ${amount} ${symbol} at ${price}, profit: ${profit}, new balance: ${this.dailyStats.currentBalance}`);
            }
            else {
                console.log(`No open position found for ${symbol} to sell`);
            }
        }
    }
    async executeTrade(symbol, side, amount) {
        const currentPrice = this.marketData[this.marketData.length - 1]?.close || 0;
        if (this.config.demoMode) {
            this.simulateTrade(symbol, side, amount, currentPrice);
        }
        else {
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
                    const position = {
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
                }
                else if (side === 'sell') {
                    // Найти и закрыть позицию
                    const positionIndex = this.positions.findIndex(p => p.symbol === symbol && p.side === 'buy');
                    if (positionIndex !== -1) {
                        const position = this.positions[positionIndex];
                        const profit = (currentPrice - position.entryPrice) * amount;
                        this.positions.splice(positionIndex, 1);
                        this.dailyStats.currentBalance += amount * currentPrice; // Вернуть стоимость продажи
                        this.recordTrade(symbol, side, amount, currentPrice, profit);
                    }
                    else {
                        console.log(`No open position found for ${symbol} to sell`);
                        this.recordTrade(symbol, side, amount, currentPrice, 0);
                    }
                }
            }
            catch (error) {
                console.error('Failed to execute trade:', error);
            }
        }
    }
    recordTrade(symbol, side, amount, price, profit) {
        const trade = {
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
    mainLoopInterval = null;
    async start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        console.log('🤖 KuCoin Bot started');
        // Инициализация баланса
        if (this.config.demoMode) {
            this.dailyStats.startBalance = 1000; // Виртуальный начальный баланс для демо
            this.dailyStats.currentBalance = this.dailyStats.startBalance;
            console.log('Demo mode: Virtual balance initialized to 1000 USDT');
        }
        else {
            try {
                const balance = await this.kucoinService.getBalance();
                this.dailyStats.startBalance = balance.total.USDT || 0;
                this.dailyStats.currentBalance = this.dailyStats.startBalance;
            }
            catch (error) {
                console.error('Failed to initialize balance:', error);
            }
        }
        // Train ML model with historical data
        await this.trainMLModel();
        // Основной цикл (пока заглушка, будет расширен стратегиями)
        this.mainLoopInterval = setInterval(() => this.runMainLoopIteration(), 30000);
    }
    async stop() {
        this.isRunning = false;
        if (this.mainLoopInterval) {
            clearInterval(this.mainLoopInterval);
            this.mainLoopInterval = null;
        }
        console.log('🤖 KuCoin Bot stopped');
    }
    async runMainLoopIteration() {
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
                }
                else if (signal === 'sell') {
                    await this.executeTrade(this.config.symbols[0], 'sell', this.positions.length > 0 ? this.positions[0].amount : 0);
                }
            }
        }
        catch (error) {
            console.error('Error in main loop:', error);
        }
    }
    async updateMarketData() {
        try {
            const symbol = this.config.symbols[0];
            const historicalData = await this.kucoinService.getHistoricalData(symbol, '1h', 100);
            this.marketData = historicalData;
        }
        catch (error) {
            console.error('Failed to update market data:', error);
            // Continue with empty data
            this.marketData = [];
        }
    }
    async trainMLModel() {
        if (process.env.NODE_ENV !== 'production') {
            console.log('Skipping ML training in development mode');
            return;
        }
        try {
            // Get historical data for training (last 500 candles, 1h timeframe)
            const historicalData = await this.kucoinService.getHistoricalData(this.config.symbols[0], '1h', 500);
            if (this.strategy && 'mlPredictor' in this.strategy) {
                this.strategy.mlPredictor.train(historicalData);
            }
        }
        catch (error) {
            console.error('Failed to train ML model:', error);
            console.log('Continuing without ML training');
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
            // Выполнять trade напрямую, без очереди
            await this.executeTrade(symbol, side, amount);
            return {
                status: 'executed',
                message: 'Trade executed successfully'
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
    setDemoMode(enabled) {
        this.config.demoMode = enabled;
        console.log(`Demo mode ${enabled ? 'enabled' : 'disabled'}`);
    }
    getDemoTrades() {
        return this.demoTrades;
    }
    clearDemoTrades() {
        this.demoTrades = [];
    }
    async getMarketUpdate() {
        const symbol = this.config.symbols[0];
        const ticker = await this.kucoinService.getTicker(symbol);
        const price = ticker.last;
        const change24h = ticker.percentage * 100;
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
            mlConfidence = this.strategy.mlPredictor.predict(this.marketData);
        }
        const mlPercent = (mlConfidence * 100).toFixed(1);
        const mlText = mlConfidence > 0.6 ? 'ВВЕРХ' : mlConfidence < 0.4 ? 'ВНИЗ' : 'НЕЙТРАЛЬНО';
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
        return {
            symbol,
            price,
            change24h,
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
        };
    }
}
//# sourceMappingURL=bot.js.map