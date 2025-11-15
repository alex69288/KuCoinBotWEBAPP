import pandas as pd;

export class TradingMetrics {
  static calculateMetrics(trades: any[]): any {
    const df = pd.DataFrame(trades);

    // Общее количество сделок
    const totalTrades = df.shape[0];

    // Win Rate
    const wins = df[df['profit'] > 0].shape[0];
    const winRate = (wins / totalTrades) * 100;

    // Profit Factor
    const totalProfit = df[df['profit'] > 0]['profit'].sum();
    const totalLoss = df[df['profit'] < 0]['profit'].sum();
    const profitFactor = totalProfit / Math.abs(totalLoss);

    // Общая прибыль
    const netProfit = df['profit'].sum();

    // Максимальная просадка
    const drawdown = df['balance'].min();

    // Лучшая/худшая сделка
    const bestTrade = df['profit'].max();
    const worstTrade = df['profit'].min();

    // Средняя прибыль/убыток
    const avgProfit = df['profit'].mean();

    // Серии побед/поражений
    const streaks = df['profit'].apply((x) => (x > 0 ? 1 : -1)).cumsum();

    return {
      totalTrades,
      winRate,
      profitFactor,
      netProfit,
      drawdown,
      bestTrade,
      worstTrade,
      avgProfit,
      streaks,
    };
  }
}