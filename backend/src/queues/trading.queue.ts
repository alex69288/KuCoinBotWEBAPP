import Queue from 'bull';
import { kucoinService } from '../services/kucoin.service.js';

interface TradeJobData {
  symbol: string;
  type: 'limit' | 'market';
  side: 'buy' | 'sell';
  amount: number;
  price?: number;
  userId: string;
}

const tradingQueue = new Queue('trading', {
  redis: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 50,
  },
});

// Process trading jobs
tradingQueue.process(async (job) => {
  const { symbol, type, side, amount, price, userId }: TradeJobData = job.data;

  try {
    console.log(`Processing trade for user ${userId}: ${side} ${amount} ${symbol}`);

    const order = await kucoinService.createOrder(symbol, type, side, amount, price);

    console.log(`Order created successfully: ${order.id}`);

    return order;
  } catch (error) {
    console.error('Error processing trade job:', error);
    throw error;
  }
});

// Add job to queue
export const addTradeJob = (data: TradeJobData) => {
  return tradingQueue.add(data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  });
};

// Get queue status
export const getQueueStatus = async () => {
  const waiting = await tradingQueue.getWaiting();
  const active = await tradingQueue.getActive();
  const completed = await tradingQueue.getCompleted();
  const failed = await tradingQueue.getFailed();

  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length,
  };
};

export default tradingQueue;