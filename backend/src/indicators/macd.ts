import { calculateEMA } from './ema';

export interface MACDResult {
  macd: number[];
  signal: number[];
  histogram: number[];
}

export function calculateMACD(
  prices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult {
  if (prices.length < slowPeriod) return { macd: [], signal: [], histogram: [] };

  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);

  // MACD line = fastEMA - slowEMA
  const macd: number[] = [];
  const startIndex = slowPeriod - fastPeriod;
  for (let i = 0; i < slowEMA.length; i++) {
    macd.push(fastEMA[i + startIndex] - slowEMA[i]);
  }

  // Signal line = EMA of MACD
  const signal = calculateEMA(macd, signalPeriod);

  // Histogram = MACD - Signal
  const histogram: number[] = [];
  const signalStartIndex = signalPeriod - 1;
  for (let i = 0; i < signal.length; i++) {
    histogram.push(macd[i + signalStartIndex] - signal[i]);
  }

  return { macd, signal, histogram };
}