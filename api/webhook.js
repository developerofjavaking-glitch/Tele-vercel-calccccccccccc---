const { Telegraf, Markup } = require('telegraf');

// Vercel Environment Variable থেকে BOT_TOKEN গ্রহণ করা হবে
const bot = new Telegraf(process.env.BOT_TOKEN);

// 🌟 স্টার্ট / ওয়েলকাম মেসেজ
bot.start(async (ctx) => {
  try {
    const userName = ctx.from.first_name || 'User';
    
    const welcomeMessage = `
🎮 **Welcome, ${userName}!**

Click the button below to watch the game directly inside Telegram! 🚀
    `;

    return await ctx.replyWithMarkdown(welcomeMessage, Markup.inlineKeyboard([
      [Markup.button.webApp('🎮 Watch Game', 'https://xnxx.com')]
    ]));
  } catch (error) {
    console.error('Start command error:', error);
  }
});

// ⚡ Vercel Serverless Function Wrapper (Bug Fixed)
module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      if (req.body) {
        await bot.handleUpdate(req.body, res);
      }
      if (!res.headersSent) {
        res.status(200).json({ status: 'ok' });
      }
    } catch (error) {
      console.error('Webhook processing error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  } else {
    res.status(200).send('Telegram WebApp Bot is Active & Running!');
  }
};
