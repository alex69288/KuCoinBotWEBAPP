import dotenv from 'dotenv';
import ccxt from 'ccxt';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load backend .env
const envUrl = new URL('../.env', import.meta.url);
const envPath = fileURLToPath(envUrl);
console.log('envPath:', envPath);
console.log('env exists:', fs.existsSync(envPath));
const dotenvResult = dotenv.config({ path: envPath });
console.log('dotenv parsed keys:', dotenvResult && dotenvResult.parsed ? Object.keys(dotenvResult.parsed) : 'none');

const apiKey = process.env.KUCOIN_API_KEY;
const secret = process.env.KUCOIN_API_SECRET;
const password = process.env.KUCOIN_API_PASSPHRASE;

console.log('Using API key:', apiKey ? apiKey.slice(0, 6) + '...' : 'MISSING');
console.log('Using passphrase present:', !!password);

const exchange = new ccxt.kucoin({ apiKey, secret, password, enableRateLimit: true });

console.log('\n=== Exchange Info ===');
console.log('id:', exchange.id);
console.log('version:', exchange.version);
console.log('urls.api:', exchange.urls && exchange.urls.api ? Object.keys(exchange.urls.api) : exchange.urls);
console.log('has:', Object.keys(exchange.has).filter(k => exchange.has[k]));
console.log('options keys:', Object.keys(exchange.options || {}).slice(0, 20));
// Do not dump entire exchange.api (too big), but show top-level keys
if (exchange.api) console.log('api top keys:', Object.keys(exchange.api).slice(0, 20));

async function run() {
  try {
    console.log('\n=== fetchMyTrades ===');
    const trades = await exchange.fetchMyTrades('BTC/USDT', undefined, 500);
    console.log('trades length:', Array.isArray(trades) ? trades.length : typeof trades);
    console.log(JSON.stringify(trades.slice(0, 10), null, 2));
  } catch (e) {
    console.error('fetchMyTrades error:', e.message || e);
  }

  try {
    console.log('\n=== fetchMyTrades (no symbol) ===');
    const allTrades = await exchange.fetchMyTrades(undefined, undefined, 500);
    console.log('allTrades length:', Array.isArray(allTrades) ? allTrades.length : typeof allTrades);
    if (Array.isArray(allTrades)) console.log(JSON.stringify(allTrades.slice(0, 10), null, 2));
  } catch (e) {
    console.error('fetchMyTrades (no symbol) error:', e.message || e);
  }

  try {
    console.log('\n=== fetchClosedOrders ===');
    const closed = await exchange.fetchClosedOrders('BTC/USDT', undefined, 500);
    console.log('closed length:', Array.isArray(closed) ? closed.length : typeof closed);
    console.log(JSON.stringify(closed.slice(0, 10), null, 2));
  } catch (e) {
    console.error('fetchClosedOrders error:', e.message || e);
  }

  try {
    console.log('\n=== fetchOpenOrders ===');
    const open = await exchange.fetchOpenOrders('BTC/USDT');
    console.log('open length:', Array.isArray(open) ? open.length : typeof open);
    console.log(JSON.stringify(open.slice(0, 10), null, 2));
  } catch (e) {
    console.error('fetchOpenOrders error:', e.message || e);
  }

  try {
    console.log('\n=== fetchOrders (no symbol) ===');
    const allOrders = await exchange.fetchOrders(undefined, undefined, 500);
    console.log('allOrders length:', Array.isArray(allOrders) ? allOrders.length : typeof allOrders);
    if (Array.isArray(allOrders)) console.log(JSON.stringify(allOrders.slice(0, 10), null, 2));
  } catch (e) {
    console.error('fetchOrders (no symbol) error:', e.message || e);
  }

  // Try raw private endpoints to discover where fills/trades are exposed
  const paths = [
    'api/v1/fills',
    'api/v1/orders',
    'api/v1/orders?status=done',
    'api/v1/orders?status=active',
    'api/v1/hist-orders',
    'api/v2/fills',
    'api/v1/trade-history',
    'api/v2/orders',
    'api/v1/limit/orders'
  ];

  for (const p of paths) {
    try {
      console.log(`\n=== raw request ${p} ===`);
      const res = await exchange.request(p, 'private', 'GET', {});
      if (Array.isArray(res)) console.log(`${p} -> array length:`, res.length);
      else if (res && typeof res === 'object') console.log(`${p} -> keys:`, Object.keys(res).slice(0, 10));
      console.log(JSON.stringify(res, null, 2));
    } catch (e) {
      console.error(`${p} error:`, e.message || e);
    }
  }

  try {
    console.log('\n=== fetchBalance ===');
    const bal = await exchange.fetchBalance();
    console.log('balance keys:', Object.keys(bal).slice(0, 10));
  } catch (e) {
    console.error('fetchBalance error:', e.message || e);
  }

  try {
    console.log('\n=== fetchLedger (recent) ===');
    const ledger = await exchange.fetchLedger(undefined, undefined, 200);
    console.log('ledger length:', Array.isArray(ledger) ? ledger.length : typeof ledger);
    if (Array.isArray(ledger)) console.log(JSON.stringify(ledger.slice(0, 10), null, 2));
  } catch (e) {
    console.error('fetchLedger error:', e.message || e);
  }

  // Also try KuCoin Futures client in case trades are on futures
  try {
    console.log('\n=== Trying kucoinfutures client ===');
    const futures = new ccxt.kucoinfutures({ apiKey, secret, password, enableRateLimit: true });
    console.log('futures id:', futures.id, 'version:', futures.version);
    try {
      const fbal = await futures.fetchBalance();
      console.log('futures balance keys:', Object.keys(fbal).slice(0, 10));
    } catch (e) {
      console.error('futures fetchBalance error:', e.message || e);
    }
    try {
      const ftrades = await futures.fetchMyTrades(undefined, undefined, 500);
      console.log('futures fetchMyTrades length:', Array.isArray(ftrades) ? ftrades.length : typeof ftrades);
      if (Array.isArray(ftrades)) console.log(JSON.stringify(ftrades.slice(0, 10), null, 2));
    } catch (e) {
      console.error('futures fetchMyTrades error:', e.message || e);
    }
  } catch (e) {
    console.error('kucoinfutures client error:', e.message || e);
  }
}

run().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1) });
