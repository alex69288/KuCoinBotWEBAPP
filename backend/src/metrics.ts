import { Trade } from './core/bot';

/**
 * Calculate total number of trades.
 * @param trades List of all trades.
 * @returns Total number of trades.
 */
export function calculateTotalTrades(trades: Trade[]): number {
  return trades.length;
}

/**
 * Calculate Win Rate (percentage of profitable trades).
 * @param trades List of all trades.
 * @returns Win Rate as a percentage.
 */
export function calculateWinRate(trades: Trade[]): number {
  const wins = trades.filter(trade => trade.profit > 0).length;
  return (wins / trades.length) * 100;
}

/**
 * Calculate Profit Factor (ratio of gross profit to gross loss).
 * @param trades List of all trades.
 * @returns Profit Factor.
 */
export function calculateProfitFactor(trades: Trade[]): number {
  const grossProfit = trades.filter(trade => trade.profit > 0).reduce((sum, trade) => sum + trade.profit, 0);
  const grossLoss = trades.filter(trade => trade.profit < 0).reduce((sum, trade) => sum + Math.abs(trade.profit), 0);
  if (grossLoss === 0) return grossProfit > 0 ? Infinity : 0;
  return grossProfit / grossLoss;
}

/**
 * Calculate total profit in USDT and percentage.
 * @param trades List of all trades.
 * @param initialBalance Initial account balance.
 * @returns Total profit in USDT and percentage.
 */
export function calculateTotalProfit(trades: Trade[], initialBalance: number): { usdt: number, percentage: number } {
  const totalProfit = trades.reduce((sum, trade) => sum + trade.profit, 0);
  return {
    usdt: totalProfit,
    percentage: (totalProfit / initialBalance) * 100
  };
}

/**
 * Calculate maximum drawdown.
 * @param trades List of all trades.
 * @returns Maximum drawdown.
 */
export function calculateMaxDrawdown(trades: Trade[]): number {
  let peak = 0;
  let drawdown = 0;
  let balance = 0;

  trades.forEach(trade => {
    balance += trade.profit;
    if (balance > peak) {
      peak = balance;
    }
    const currentDrawdown = peak - balance;
    if (currentDrawdown > drawdown) {
      drawdown = currentDrawdown;
    }
  });

  return drawdown;
}

/**
 * Calculate the best and worst trades.
 * @param trades List of all trades.
 * @returns Best and worst trades.
 */
export function calculateBestAndWorstTrades(trades: Trade[]): { best: Trade | null, worst: Trade | null } {
  if (trades.length === 0) return { best: null, worst: null };

  let best = trades[0];
  let worst = trades[0];

  trades.forEach(trade => {
    if (trade.profit > best.profit) best = trade;
    if (trade.profit < worst.profit) worst = trade;
  });

  return { best, worst };
}

/**
 * Calculate the average profit and loss.
 * @param trades List of all trades.
 * @returns Average profit and loss.
 */
export function calculateAverageProfitAndLoss(trades: Trade[]): { averageProfit: number, averageLoss: number } {
  const profits = trades.filter(trade => trade.profit > 0);
  const losses = trades.filter(trade => trade.profit < 0);

  const averageProfit = profits.length > 0 ? profits.reduce((sum, trade) => sum + trade.profit, 0) / profits.length : 0;
  const averageLoss = losses.length > 0 ? losses.reduce((sum, trade) => sum + Math.abs(trade.profit), 0) / losses.length : 0;

  return { averageProfit, averageLoss };
}

/**
 * Calculate winning and losing streaks.
 * @param trades List of all trades.
 * @returns Winning and losing streaks.
 */
export function calculateStreaks(trades: Trade[]): { winningStreak: number, losingStreak: number } {
  let winningStreak = 0;
  let losingStreak = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;

  trades.forEach(trade => {
    if (trade.profit > 0) {
      currentWinStreak++;
      currentLossStreak = 0;
    } else if (trade.profit < 0) {
      currentLossStreak++;
      currentWinStreak = 0;
    }

    if (currentWinStreak > winningStreak) winningStreak = currentWinStreak;
    if (currentLossStreak > losingStreak) losingStreak = currentLossStreak;
  });

  return { winningStreak, losingStreak };
}