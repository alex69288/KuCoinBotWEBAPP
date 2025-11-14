import { Telegraf } from 'telegraf';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is not defined in environment variables');
}

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply('Добро пожаловать! Используйте /run для запуска приложения.');
});

bot.command('run', (ctx) => {
  ctx.reply('Приложение запускается...');
  // Здесь можно добавить логику запуска приложения
});

bot.launch()
  .then(() => console.log('Telegram Bot запущен'))
  .catch((err) => console.error('Ошибка запуска Telegram Bot:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

export default bot;