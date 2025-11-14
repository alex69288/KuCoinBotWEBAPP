import { RandomForestClassifier } from 'ml-random-forest';
import { calculateEMA } from '../indicators/ema';
import { calculateRSI } from '../indicators/rsi';
import { calculateMACD } from '../indicators/macd';
import { calculateBollingerBands } from '../indicators/bollinger';
import { OHLCVData } from '../strategies/base.strategy.js';

export class SimpleMLPredictor {
  private model: any = null;

  constructor() {
    // Initialize with simple rule-based prediction until trained
    this.model = {
      predict: (features: number[]) => {
        // Simple rule: if EMA fast > slow and RSI < 70, predict up
        const [emaFast, emaSlow, rsi, macd, bbUpper, bbLower] = features;
        if (emaFast > emaSlow && rsi < 70) {
          return 0.75; // 75% confidence for up
        } else if (emaFast < emaSlow && rsi > 30) {
          return 0.25; // 25% confidence for down
        }
        return 0.5; // Neutral
      }
    };
  }

  predict(data: OHLCVData[]): number {
    if (data.length < 50) return 0.5; // Not enough data

    const closes = data.map(d => d.close);
    const volumes = data.map(d => d.volume);

    // Calculate indicators
    const emaFast = calculateEMA(closes, 12);
    const emaSlow = calculateEMA(closes, 26);
    const rsi = calculateRSI(closes, 14);
    const macd = calculateMACD(closes);
    const bb = calculateBollingerBands(closes, 20);

    if (emaFast.length === 0 || emaSlow.length === 0 || rsi.length === 0) return 0.5;

    const features = [
      emaFast[emaFast.length - 1],
      emaSlow[emaSlow.length - 1],
      rsi[rsi.length - 1],
      macd.macd[macd.macd.length - 1] || 0,
      bb.upper[bb.upper.length - 1] || 0,
      bb.lower[bb.lower.length - 1] || 0
    ];

    // If model is trained, use it; otherwise use rule-based
    if (this.model && this.model.constructor.name === 'RandomForestClassifier') {
      const prediction = this.model.predict([features]);
      // Assuming prediction is 0 or 1, convert to confidence
      return prediction[0] === 1 ? 0.75 : 0.25;
    }

    return this.model.predict(features);
  }

  // Train the Random Forest model
  train(data: OHLCVData[]): void {
    if (data.length < 100) {
      console.log('Not enough data for training ML model');
      return;
    }

    const trainingData = [];
    const labels = [];

    // Prepare training data: use historical data to predict next price movement
    for (let i = 50; i < data.length - 1; i++) {
      const window = data.slice(i - 50, i);
      const closes = window.map(d => d.close);

      const emaFast = calculateEMA(closes, 12);
      const emaSlow = calculateEMA(closes, 26);
      const rsi = calculateRSI(closes, 14);
      const macd = calculateMACD(closes);
      const bb = calculateBollingerBands(closes, 20);

      if (emaFast.length === 0 || emaSlow.length === 0 || rsi.length === 0) continue;

      const features = [
        emaFast[emaFast.length - 1],
        emaSlow[emaSlow.length - 1],
        rsi[rsi.length - 1],
        macd.macd[macd.macd.length - 1] || 0,
        bb.upper[bb.upper.length - 1] || 0,
        bb.lower[bb.lower.length - 1] || 0
      ];

      // Label: 1 if next close > current close (up), 0 otherwise (down)
      const label = data[i + 1].close > data[i].close ? 1 : 0;

      trainingData.push(features);
      labels.push(label);
    }

    if (trainingData.length === 0) {
      console.log('No valid training data generated');
      return;
    }

    // Train Random Forest
    const options = {
      seed: 42,
      maxFeatures: 4,
      replacement: true,
      nEstimators: 50
    };

    this.model = new RandomForestClassifier(options);
    this.model.train(trainingData, labels);

    console.log(`Trained Random Forest model with ${trainingData.length} samples`);
  }
}