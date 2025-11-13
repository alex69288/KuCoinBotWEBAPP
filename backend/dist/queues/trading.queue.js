"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQueueStatus = exports.addTradeJob = void 0;
const kucoin_service_js_1 = require("../services/kucoin.service.js");
// In-memory queue implementation (fallback when Redis is not available)
class InMemoryTradingQueue {
    constructor() {
        this.jobs = [];
        this.processing = false;
        this.stats = {
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
        };
    }
    async add(data) {
        this.jobs.push(data);
        this.stats.waiting++;
        console.log(`Job added to in-memory queue. Total jobs: ${this.jobs.length}`);
        // Auto-process if not already processing
        if (!this.processing) {
            this.processJobs();
        }
        return { id: Date.now().toString(), data };
    }
    async processJobs() {
        if (this.processing || this.jobs.length === 0)
            return;
        this.processing = true;
        while (this.jobs.length > 0) {
            const job = this.jobs.shift();
            if (!job)
                continue;
            this.stats.waiting--;
            this.stats.active++;
            try {
                console.log(`Processing trade for user ${job.userId}: ${job.side} ${job.amount} ${job.symbol}`);
                const order = await kucoin_service_js_1.kucoinService.createOrder(job.symbol, job.type, job.side, job.amount, job.price);
                console.log(`Order created successfully: ${order.id}`);
                this.stats.completed++;
            }
            catch (error) {
                console.error('Error processing trade job:', error);
                this.stats.failed++;
            }
            finally {
                this.stats.active--;
            }
        }
        this.processing = false;
    }
    async getWaiting() {
        return this.jobs;
    }
    async getActive() {
        return this.processing ? [{}] : [];
    }
    async getCompleted() {
        return Array(this.stats.completed).fill({});
    }
    async getFailed() {
        return Array(this.stats.failed).fill({});
    }
}
// Try to use Redis Bull queue, fallback to in-memory if Redis unavailable
let tradingQueue;
try {
    // Try to import Bull and create Redis queue
    const Queue = (await Promise.resolve().then(() => __importStar(require('bull')))).default;
    tradingQueue = new Queue('trading', {
        redis: {
            host: process.env.REDIS_URL ? new URL(process.env.REDIS_URL).hostname : '127.0.0.1',
            port: process.env.REDIS_URL ? parseInt(new URL(process.env.REDIS_URL).port) || 6379 : 6379,
            password: process.env.REDIS_PASSWORD || undefined,
        },
        defaultJobOptions: {
            removeOnComplete: 50,
            removeOnFail: 50,
        },
    });
    // Test Redis connection
    await tradingQueue.isReady();
    console.log('✅ Redis queue initialized successfully');
    // Process trading jobs
    tradingQueue.process(async (job) => {
        const { symbol, type, side, amount, price, userId } = job.data;
        try {
            console.log(`Processing trade for user ${userId}: ${side} ${amount} ${symbol}`);
            const order = await kucoin_service_js_1.kucoinService.createOrder(symbol, type, side, amount, price);
            console.log(`Order created successfully: ${order.id}`);
            return order;
        }
        catch (error) {
            console.error('Error processing trade job:', error);
            throw error;
        }
    });
}
catch (error) {
    console.warn('⚠️ Redis not available, using in-memory queue:', error instanceof Error ? error.message : String(error));
    // Fallback to in-memory queue
    tradingQueue = new InMemoryTradingQueue();
}
// Add job to queue
const addTradeJob = (data) => {
    return tradingQueue.add(data, {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
    });
};
exports.addTradeJob = addTradeJob;
// Get queue status
const getQueueStatus = async () => {
    try {
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
    }
    catch (error) {
        // For in-memory queue
        return {
            waiting: tradingQueue.jobs?.length || 0,
            active: tradingQueue.processing ? 1 : 0,
            completed: tradingQueue.stats?.completed || 0,
            failed: tradingQueue.stats?.failed || 0,
        };
    }
};
exports.getQueueStatus = getQueueStatus;
exports.default = tradingQueue;
//# sourceMappingURL=trading.queue.js.map