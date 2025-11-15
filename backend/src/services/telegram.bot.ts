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
    const message = await botInstance.getMarketUpdateMessage();
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