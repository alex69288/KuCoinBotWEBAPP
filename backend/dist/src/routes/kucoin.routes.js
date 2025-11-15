import { Router } from 'express';
import { kucoinService } from '../services/kucoin.service.js';
const kucoinServiceInstance = kucoinService();
import { addTradeJob } from '../queues/trading.queue.js';
const router = Router();
// Get balance
router.get('/balance', async (req, res) => {
    try {
        const balance = await kucoinServiceInstance.getBalance();
        res.json(balance);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch balance' });
    }
});
// Get ticker
router.get('/ticker/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        console.log('Fetching ticker for symbol:', symbol);
        if (symbol.includes(':')) {
            return res.status(400).json({ error: 'Invalid symbol: placeholder detected' });
        }
        const ticker = await kucoinServiceInstance.getTicker(symbol);
        res.json(ticker);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch ticker' });
    }
});
// Get order book
router.get('/orderbook/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        console.log('Fetching order book for symbol:', symbol);
        if (symbol.includes(':')) {
            return res.status(400).json({ error: 'Invalid symbol: placeholder detected' });
        }
        const limit = parseInt(req.query.limit) || 20;
        const orderBook = await kucoinServiceInstance.getOrderBook(symbol, limit);
        res.json(orderBook);
    }
    catch (error) {
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
            message: 'Trade order queued'
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to queue order' });
    }
});
// Get open orders
router.get('/orders/open', async (req, res) => {
    try {
        const { symbol } = req.query;
        const orders = await kucoinServiceInstance.getOpenOrders(symbol);
        res.json(orders);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch open orders' });
    }
});
// Cancel order
router.delete('/orders/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { symbol } = req.query;
        const result = await kucoinServiceInstance.cancelOrder(orderId, symbol);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to cancel order' });
    }
});
// Get order history
router.get('/orders/history', async (req, res) => {
    try {
        const { symbol, limit } = req.query;
        const orders = await kucoinServiceInstance.getOrderHistory(symbol, parseInt(limit) || 50);
        res.json(orders);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch order history' });
    }
});
// Get trades
router.get('/trades', async (req, res) => {
    try {
        const { symbol, limit } = req.query;
        const trades = await kucoinServiceInstance.getTrades(symbol, parseInt(limit) || 50);
        res.json(trades);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch trades' });
    }
});
// Get markets
router.get('/markets', async (req, res) => {
    try {
        const markets = await kucoinServiceInstance.getMarkets();
        res.json(markets);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch markets' });
    }
});
export default router;
//# sourceMappingURL=kucoin.routes.js.map