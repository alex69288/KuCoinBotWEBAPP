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
    // Рассчитываем комиссию и корректируем сообщение
    const commissionPercent = update.config?.strategyConfig?.commissionPercent || 0.1;
    const buyFeesUSDT = (update.positionSize || 0) * (update.entryPrice || 0) * (commissionPercent / 100);
    const sellFeesUSDT = (update.positionSize || 0) * (update.tpPriceAdjustedForFees || update.tpPrice || 0) * (commissionPercent / 100);
    const totalFeesUSDT = buyFeesUSDT + sellFeesUSDT;

    const message = `📈 ОБНОВЛЕНИЕ РЫНКА
💱 Пара: ₿ Bitcoin (${update.symbol})
💰 Цена: ${update.price.toFixed(2)} USDT
📊 24ч: ${update.change24h.toFixed(2)}% (${update.change24hAmount?.toFixed(2) || '0.00'} USDT)
📈 EMA: ${update.emaDirection === 'ВВЕРХ' ? '🟢' : '🔴'} ${update.emaDirection} (${update.emaPercent.toFixed(2)}%)
🎯 Сигнал: ${update.signal === 'buy' ? '🟢 ПОКУПКА' : update.signal === 'sell' ? '🔴 ПРОДАЖА' : '⚪️ ОЖИДАНИЕ'}
🤖 ML: ${update.mlConfidence > 0.7 ? '🟢' : update.mlConfidence < 0.4 ? '🔴' : '⚪️'} ${update.mlText} (${update.mlPercent}%)

${update.openPositionsCount > 0 ? `💼 ПОЗИЦИЯ ОТКРЫТА (РЕЖИМ %)
📊 Количество открытых позиций: ${update.openPositionsCount}
💰 Размер ставки: ${update.stakeSize.toFixed(2)} USDT
🎯 Цена входа (TP): ${update.entryPrice.toFixed(2)} USDT
📈 Текущая прибыль: ${update.profitPercent.toFixed(2)}% (${update.currentProfit.toFixed(4)} USDT)
🎯 До Take Profit: ${update.toTPPercent.toFixed(1)}% (учтены комиссии)
🎯 Цель TP: ${update.config?.strategyConfig?.takeProfitPercent || 2}%
🛡️ Комиссия: ${commissionPercent}% на покупку / ${commissionPercent}% на продажу (итого: ${(commissionPercent * 2).toFixed(2)}%)
💸 Расчётная комиссия при достижении TP: ${totalFeesUSDT.toFixed(4)} USDT (купля: ${buyFeesUSDT.toFixed(4)} / продажа: ${sellFeesUSDT.toFixed(4)})


` : '💼 ПОЗИЦИЙ НЕТ'}`;
    ctx.reply(message);
  } catch (error) {
    ctx.reply(`Ошибка получения обновления рынка: ${(error as Error).message}`);
  }
});

bot.launch()
  .then(() => console.log('Telegram Bot запущен'))
  .catch((err) => console.error('Ошибка запуска Telegram Bot:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

export default bot;