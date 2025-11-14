import { kucoinService } from '../services/kucoin.service';
// In-memory queue implementation (fallback when Redis is not available)
class InMemoryTradingQueue {
    jobs = [];
    processing = false;
    stats = {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
    };
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
                const order = await kucoinService.createOrder(job.symbol, job.type, job.side, job.amount, job.price);
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
async function initQueue() {
    try {
        // Try to import Bull and create Redis queue
        const Queue = (await import('bull')).default;
        // Redis configuration - disable URL parsing in production due to Amvera issues
        console.log(`🔧 Redis config: NODE_ENV=${process.env.NODE_ENV}, REDIS_URL=${process.env.REDIS_URL ? 'present' : 'not set'}`);
        let redisConfig = {
            host: '127.0.0.1',
            port: 6379,
        };
        // In production, don't use REDIS_URL as it may point to HTTP endpoints
        // Use only REDIS_PASSWORD for authentication
        if (process.env.NODE_ENV !== 'production' && process.env.REDIS_URL) {
            try {
                const redisUrl = new URL(process.env.REDIS_URL);
                redisConfig = {
                    host: redisUrl.hostname,
                    port: parseInt(redisUrl.port) || 6379,
                    password: process.env.REDIS_PASSWORD || undefined,
                };
                console.log('✅ Using Redis URL configuration (development only)');
            }
            catch (error) {
                console.warn('⚠️ Invalid REDIS_URL format, using localhost fallback');
                redisConfig.password = process.env.REDIS_PASSWORD || undefined;
            }
        }
        else {
            console.log('ℹ️ Using localhost Redis (production) or in-memory fallback');
            redisConfig.password = process.env.REDIS_PASSWORD || undefined;
        }
        console.log(`🔧 Final Redis config: ${JSON.stringify({ host: redisConfig.host, port: redisConfig.port, hasPassword: !!redisConfig.password })}`);
        // Remove password if undefined to avoid warnings
        if (redisConfig.password === undefined) {
            delete redisConfig.password;
        }
        tradingQueue = new Queue('trading', {
            redis: redisConfig,
            defaultJobOptions: {
                removeOnComplete: 50,
                removeOnFail: 50,
            },
        });
        // Test Redis connection
        try {
            await tradingQueue.isReady();
            console.log('✅ Redis queue initialized successfully');
        }
        catch (error) {
            console.error('❌ Redis connection failed:', error);
            console.log('⚠️ Falling back to in-memory queue (jobs will not persist)');
            // Create in-memory queue as fallback
            tradingQueue = new Queue('trading', {
                defaultJobOptions: {
                    removeOnComplete: 50,
                    removeOnFail: 50,
                },
            });
        }
        // Process trading jobs
        tradingQueue.process(async (job) => {
            const { symbol, type, side, amount, price, userId } = job.data;
            try {
                console.log(`Processing trade for user ${userId}: ${side} ${amount} ${symbol}`);
                const order = await kucoinService.createOrder(symbol, type, side, amount, price);
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
}
// Initialize queue
initQueue();
// Add job to queue
export const addTradeJob = (data) => {
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
export default tradingQueue;
//# sourceMappingURL=trading.queue.js.map