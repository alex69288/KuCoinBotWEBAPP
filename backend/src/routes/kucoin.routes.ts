import { Router } from 'express';
import { kucoinService } from '../services/kucoin.service.js';
import { addTradeJob } from '../queues/trading.queue.js';

const router = Router();

// Get balance
router.get('/balance', async (req, res) => {
  try {
    const balance = await kucoinService.getBalance();
    res.json(balance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

// Get ticker
router.get('/ticker/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const ticker = await kucoinService.getTicker(symbol);
    res.json(ticker);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ticker' });
  }
});

// Get order book
router.get('/orderbook/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const orderBook = await kucoinService.getOrderBook(symbol, limit);
    res.json(orderBook);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order book' });
  }
});

// Create order (using queue)
router.post('/orders', async (req, res) => {
  try {
    const { symbol, type, side, amount, price, userId } = req.body;

    const job = await addTradeJob({
      symbol,
      type,
      side,
      amount,
      price,
      userId: userId || 'anonymous'
    });

    res.json({
      jobId: job.id,
      status: 'queued',
      message: 'Trade order queued for processing'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to queue order' });
  }
});

// Get open orders
router.get('/orders/open', async (req, res) => {
  try {
    const { symbol } = req.query;
    const orders = await kucoinService.getOpenOrders(symbol as string);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch open orders' });
  }
});

// Cancel order
router.delete('/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { symbol } = req.query;
    const result = await kucoinService.cancelOrder(orderId, symbol as string);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Get markets
router.get('/markets', async (req, res) => {
  try {
    const markets = await kucoinService.getMarkets();
    res.json(markets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch markets' });
  }
});

export default router;