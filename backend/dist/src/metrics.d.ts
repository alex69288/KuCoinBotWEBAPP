import { Trade } from './core/bot';
/**
 * Calculate total number of trades.
 * @param trades List of all trades.
 * @returns Total number of trades.
 */
export declare function calculateTotalTrades(trades: Trade[]): number;
/**
 * Calculate Win Rate (percentage of profitable trades).
 * @param trades List of all trades.
 * @returns Win Rate as a percentage.
 */
export declare function calculateWinRate(trades: Trade[]): number;
/**
 * Calculate Profit Factor (ratio of gross profit to gross loss).
 * @param trades List of all trades.
 * @returns Profit Factor.
 */
export declare function calculateProfitFactor(trades: Trade[]): number;
/**
 * Calculate total profit in USDT and percentage.
 * @param trades List of all trades.
 * @param initialBalance Initial account balance.
 * @returns Total profit in USDT and percentage.
 */
export declare function calculateTotalProfit(trades: Trade[], initialBalance: number): {
    usdt: number;
    percentage: number;
};
/**
 * Calculate maximum drawdown.
 * @param trades List of all trades.
 * @returns Maximum drawdown.
 */
export declare function calculateMaxDrawdown(trades: Trade[]): number;
/**
 * Calculate the best and worst trades.
 * @param trades List of all trades.
 * @returns Best and worst trades.
 */
export declare function calculateBestAndWorstTrades(trades: Trade[]): {
    best: Trade | null;
    worst: Trade | null;
};
/**
 * Calculate the average profit and loss.
 * @param trades List of all trades.
 * @returns Average profit and loss.
 */
export declare function calculateAverageProfitAndLoss(trades: Trade[]): {
    averageProfit: number;
    averageLoss: number;
};
/**
 * Calculate winning and losing streaks.
 * @param trades List of all trades.
 * @returns Winning and losing streaks.
 */
export declare function calculateStreaks(trades: Trade[]): {
    winningStreak: number;
    losingStreak: number;
};
//# sourceMappingURL=metrics.d.ts.map