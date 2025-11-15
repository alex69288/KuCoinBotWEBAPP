import { Trade } from '../core/bot';

export class TradingMetrics {
  static calculateMetrics(trades: Trade[]): any {
    // Общее количество сделок
    const totalTrades = trades.length;

    // Win Rate
    const wins = trades.filter(t => t.profit > 0).length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

    // Profit Factor
    const totalProfit = trades.filter(t => t.profit > 0).reduce((sum, t) => sum + t.profit, 0);
    const totalLoss = trades.filter(t => t.profit < 0).reduce((sum, t) => sum + Math.abs(t.profit), 0);
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;

    // Общая прибыль
    const netProfit = trades.reduce((sum, t) => sum + t.profit, 0);

    // Максимальная просадка (упрощенная версия)
    let peak = 0;
    let balance = 0;
    let maxDrawdown = 0;
    trades.forEach(trade => {
      balance += trade.profit;
      if (balance > peak) peak = balance;
      const drawdown = peak - balance;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    // Лучшая/худшая сделка
    const profits = trades.map(t => t.profit);
    const bestTrade = profits.length > 0 ? Math.max(...profits) : 0;
    const worstTrade = profits.length > 0 ? Math.min(...profits) : 0;

    // Средняя прибыль/убыток
    const avgProfit = totalTrades > 0 ? netProfit / totalTrades : 0;

    // Серии побед/поражений (упрощенная версия)
    let currentStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    trades.forEach(trade => {
      if (trade.profit > 0) {
        currentStreak = Math.max(0, currentStreak) + 1;
        maxWinStreak = Math.max(maxWinStreak, currentStreak);
      } else {
        currentStreak = Math.min(0, currentStreak) - 1;
        maxLossStreak = Math.max(maxLossStreak, -currentStreak);
      }
    });

    return {
      totalTrades,
      winRate,
      profitFactor,
      netProfit,
      maxDrawdown,
      bestTrade,
      worstTrade,
      avgProfit,
      maxWinStreak,
      maxLossStreak,
    };
  }
}