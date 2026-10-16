const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// আপনার Vercel অ্যাপের লাইভ ইউআরএল (যেমন: https://your-project.vercel.app)
const APP_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : 'https://your-project.vercel.app'; // আপনার আসল ভেরসেল ডোমেন দিন

bot.start((ctx) => {
  const userName = ctx.from.first_name || 'Player';
  const gameUrl = `${APP_URL}/api/index.html`;

  ctx.replyWithMarkdown(
    `🎮 **স্বাগতম ${userName}!**\n\nTic Tac Toe গেমটি খেলতে নিচের **"🎮 গেম শুরু করুন"** বাটনে ক্লিক করুন।`,
    Markup.inlineKeyboard([
      [Markup.button.webApp('🎮 গেম শুরু করুন', gameUrl)]
    ])
  );
});

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
      res.status(200).json({ status: 'success' });
    } catch (error) {
      console.error('Error handling update:', error);
      res.status(500).json({ error: 'Error in bot handler' });
    }
  } else {
    res.status(200).send('Tic Tac Toe Telegram Bot is running on Vercel!');
  }
};
