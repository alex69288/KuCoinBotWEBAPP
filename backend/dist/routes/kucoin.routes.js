"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const kucoin_service_js_1 = require("../services/kucoin.service.js");
const trading_queue_js_1 = require("../queues/trading.queue.js");
const router = (0, express_1.Router)();
// Get balance
router.get('/balance', async (req, res) => {
    try {
        const balance = await kucoin_service_js_1.kucoinService.getBalance();
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
        const ticker = await kucoin_service_js_1.kucoinService.getTicker(symbol);
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
        const limit = parseInt(req.query.limit) || 20;
        const orderBook = await kucoin_service_js_1.kucoinService.getOrderBook(symbol, limit);
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
        const job = await (0, trading_queue_js_1.addTradeJob)({
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to queue order' });
    }
});
// Get open orders
router.get('/orders/open', async (req, res) => {
    try {
        const { symbol } = req.query;
        const orders = await kucoin_service_js_1.kucoinService.getOpenOrders(symbol);
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
        const result = await kucoin_service_js_1.kucoinService.cancelOrder(orderId, symbol);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to cancel order' });
    }
});
// Get markets
router.get('/markets', async (req, res) => {
    try {
        const markets = await kucoin_service_js_1.kucoinService.getMarkets();
        res.json(markets);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch markets' });
    }
});
exports.default = router;
//# sourceMappingURL=kucoin.routes.js.map