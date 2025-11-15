import { Telegraf } from 'telegraf';
import { exec } from 'node:child_process';
import { KuCoinBot } from '../core/bot';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is not defined in environment variables');
}

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply('Добро пожаловать! Используйте /run для запуска приложения.');
});

// Исправлены типы параметров для функции exec
bot.command('run', (ctx) => {
  ctx.reply('Запуск приложения...');

  exec('npm start', (error: Error | null, stdout: string, stderr: string) => {
    if (error) {
      ctx.reply(`Ошибка запуска: ${error.message}`);
      return;
    }
    if (stderr) {
      ctx.reply(`Ошибка: ${stderr}`);
      return;
    }
    ctx.reply(`Приложение запущено: ${stdout}`);
  });
});

bot.command('market', async (ctx) => {
  try {
    const botInstance = KuCoinBot.getInstance();
    const update = await botInstance.getMarketUpdate();
    const message = `📈 ОБНОВЛЕНИЕ РЫНКА
💱 Пара: ₿ Bitcoin (${update.symbol})
💰 Цена: ${update.price.toFixed(2)} USDT
📊 24ч: ${update.change24h.toFixed(2)}%
📈 EMA: ${update.emaDirection === 'ВВЕРХ' ? '🟢' : '🔴'} ${update.emaDirection} (${update.emaPercent.toFixed(2)}%)
🎯 Сигнал: ${update.signal === 'buy' ? '🟢 ПОКУПКА' : update.signal === 'sell' ? '🔴 ПРОДАЖА' : '⚪️ ОЖИДАНИЕ'}
🤖 ML: ${update.mlConfidence > 0.6 ? '🟢' : update.mlConfidence < 0.4 ? '🔴' : '⚪️'} ${update.mlText} (${update.mlPercent}%)

${update.openPositionsCount > 0 ? `💼 ПОЗИЦИЯ ОТКРЫТА (РЕЖИМ %)
📊 Количество открытых позиций: ${update.openPositionsCount}
💰 Размер ставки: ${update.stakeSize.toFixed(2)} USDT
🎯 Цена входа (TP): ${update.entryPrice.toFixed(2)} USDT
📈 Текущая прибыль: ${update.profitPercent.toFixed(2)}% (${update.currentProfit.toFixed(4)} USDT)
🎯 До Take Profit: ${update.toTPPercent.toFixed(1)}%
🎯 Цель TP: ${update.config?.strategyConfig?.takeProfitPercent || 2}%
🛡️ Комиссии: ${update.config?.strategyConfig?.commissionPercent || 0.2}% (${(Math.abs(update.currentProfit) * ((update.config?.strategyConfig?.commissionPercent || 0.2) / 100)).toFixed(4)} USDT)` : '💼 ПОЗИЦИЙ НЕТ'}`;
    ctx.reply(message);
  } catch (error) {
    ctx.reply(`Ошибка получения обновления рынка: ${error.message}`);
  }
});

bot.launch()
  .then(() => console.log('Telegram Bot запущен'))
  .catch((err) => console.error('Ошибка запуска Telegram Bot:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

export default bot;