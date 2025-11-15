import { BaseStrategy } from './base.strategy';
export class PriceActionStrategy extends BaseStrategy {
    supportLevels = [];
    resistanceLevels = [];
    lastSignal = 'hold';
    entryPrice = 0;
    constructor(config) {
        super(config);
    }
    getName() {
        return 'Price Action Strategy';
    }
    findSupportResistance(data) {
        const config = this.config;
        const highs = data.map(d => d.high);
        const lows = data.map(d => d.low);
        // Поиск локальных максимумов и минимумов
        const localHighs = [];
        const localLows = [];
        for (let i = config.lookbackPeriod; i < highs.length - config.lookbackPeriod; i++) {
            // Локальный максимум
            let isLocalHigh = true;
            for (let j = i - config.lookbackPeriod; j <= i + config.lookbackPeriod; j++) {
                if (j !== i && highs[j] >= highs[i]) {
                    isLocalHigh = false;
                    break;
                }
            }
            if (isLocalHigh) {
                localHighs.push(highs[i]);
            }
            // Локальный минимум
            let isLocalLow = true;
            for (let j = i - config.lookbackPeriod; j <= i + config.lookbackPeriod; j++) {
                if (j !== i && lows[j] <= lows[i]) {
                    isLocalLow = false;
                    break;
                }
            }
            if (isLocalLow) {
                localLows.push(lows[i]);
            }
        }
        // Группировка близких уровней (кластеризация)
        this.resistanceLevels = this.clusterLevels(localHighs, 0.005); // 0.5% tolerance
        this.supportLevels = this.clusterLevels(localLows, 0.005);
    }
    clusterLevels(levels, tolerance) {
        if (levels.length === 0)
            return [];
        const clusters = [];
        const sortedLevels = [...levels].sort((a, b) => a - b);
        let currentCluster = [sortedLevels[0]];
        for (let i = 1; i < sortedLevels.length; i++) {
            const level = sortedLevels[i];
            const clusterAvg = currentCluster.reduce((sum, l) => sum + l, 0) / currentCluster.length;
            if (Math.abs(level - clusterAvg) / clusterAvg <= tolerance) {
                currentCluster.push(level);
            }
            else {
                clusters.push(currentCluster.reduce((sum, l) => sum + l, 0) / currentCluster.length);
                currentCluster = [level];
            }
        }
        if (currentCluster.length > 0) {
            clusters.push(currentCluster.reduce((sum, l) => sum + l, 0) / currentCluster.length);
        }
        return clusters;
    }
    detectCandlestickPatterns(data) {
        if (data.length < 3)
            return null;
        const current = data[data.length - 1];
        const previous = data[data.length - 2];
        const beforePrevious = data[data.length - 3];
        const body = Math.abs(current.close - current.open);
        const upperWick = current.high - Math.max(current.open, current.close);
        const lowerWick = Math.min(current.open, current.close) - current.low;
        const totalRange = current.high - current.low;
        // Пин-бар (Pin Bar)
        if (lowerWick > body * 2 && upperWick < body * 0.5 && current.close > current.open) {
            return { pattern: 'bullish_pin', strength: 0.8 };
        }
        if (upperWick > body * 2 && lowerWick < body * 0.5 && current.close < current.open) {
            return { pattern: 'bearish_pin', strength: 0.8 };
        }
        // Engulfing паттерн
        const prevBody = Math.abs(previous.close - previous.open);
        const isBullishEngulfing = current.close > current.open &&
            current.open < previous.close &&
            current.close > previous.open &&
            body > prevBody * 1.1;
        const isBearishEngulfing = current.close < current.open &&
            current.open > previous.close &&
            current.close < previous.open &&
            body > prevBody * 1.1;
        if (isBullishEngulfing) {
            return { pattern: 'bullish_engulfing', strength: 0.9 };
        }
        if (isBearishEngulfing) {
            return { pattern: 'bearish_engulfing', strength: 0.9 };
        }
        // Inside Bar
        if (current.high <= previous.high && current.low >= previous.low) {
            const direction = current.close > previous.close ? 'bullish' : 'bearish';
            return { pattern: `${direction}_inside_bar`, strength: 0.6 };
        }
        return null;
    }
    checkBreakout(currentPrice, levels, threshold) {
        for (const level of levels) {
            const breakoutPercent = Math.abs(currentPrice - level) / level;
            if (breakoutPercent <= threshold) {
                return true;
            }
        }
        return false;
    }
    calculateSignal(data) {
        if (data.length < this.config.lookbackPeriod)
            return 'hold';
        this.findSupportResistance(data);
        const currentCandle = data[data.length - 1];
        const config = this.config;
        // Check take profit / stop loss first
        if (this.lastSignal === 'buy' && this.entryPrice > 0) {
            const profitPercent = (currentCandle.close - this.entryPrice) / this.entryPrice * 100;
            if (profitPercent >= config.takeProfitPercent + 2 * config.commissionPercent) {
                this.lastSignal = 'hold';
                this.entryPrice = 0;
                return 'sell';
            }
            if (profitPercent <= -config.stopLossPercent) {
                this.lastSignal = 'hold';
                this.entryPrice = 0;
                return 'sell';
            }
        }
        // Buy signal on breakout above resistance
        if (config.useSupportResistance) {
            for (const resistance of this.resistanceLevels) {
                if (currentCandle.close > resistance * (1 + config.breakoutThreshold / 100) && this.lastSignal !== 'buy') {
                    this.lastSignal = 'buy';
                    this.entryPrice = currentCandle.close;
                    return 'buy';
                }
            }
        }
        // Анализ свечных паттернов (если включено)
        if (config.useCandlestickPatterns) {
            const pattern = this.detectCandlestickPatterns(data);
            if (pattern && pattern.strength > 0.8 && pattern.pattern.startsWith('bullish') && this.lastSignal !== 'buy') {
                this.lastSignal = 'buy';
                this.entryPrice = currentCandle.close;
                return 'buy';
            }
        }
        return 'hold';
    }
    getStatus() {
        return {
            name: this.getName(),
            lastSignal: this.lastSignal,
            entryPrice: this.entryPrice,
            supportLevels: this.supportLevels,
            resistanceLevels: this.resistanceLevels,
            config: this.config
        };
    }
}
//# sourceMappingURL=price-action.strategy.js.map