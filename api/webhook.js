const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// স্টার্ট কমান্ড
bot.start((ctx) => {
  ctx.reply('স্বাগতম! 🧮 আমি একটি ক্যালকুলেটর বট।\n\nহিসাব করতে এভাবে লিখুন:\n/calc 5 + 3\nঅথবা সরাসরি গাণিতিক সমস্যা দিন যেমন: /calc 10 * 5 - 2');
});

// ক্যালকুলেটর কমান্ড
bot.command('calc', (ctx) => {
  const text = ctx.message.text;
  // '/calc ' অংশটি বাদ দিয়ে শুধু সমীকরণটি নেওয়া
  const query = text.replace('/calc', '').trim();

  if (!query) {
    return ctx.reply('দয়া করে কোনো সমীকরণ দিন। যেমন: /calc 12 + 8');
  }

  try {
    // নিরাপত্তা বজায় রাখতে শুধুমাত্র সংখ্যা এবং গণিতের চিহ্ন (+, -, *, /, ., শেপ) ফিল্টার করা
    if (!/^[0-9+\-*/().\s]+$/.test(query)) {
      return ctx.reply('দুঃখিত, শুধুমাত্র গাণিতিক সংখ্যা ও চিহ্ন ব্যবহার করা যাবে।');
    }

    // সেফ ইভ্যালুয়েশন (Safe Evaluation)
    const result = Function(`'use strict'; return (${query})`)();

    ctx.reply(`🧮 ফলাফল: ${query} = ${result}`);
  } catch (error) {
    ctx.reply('গণনা করতে সমস্যা হয়েছে। দয়া করে সঠিক ফরম্যাটে সমীকরণ লিখুন।');
  }
});

// Vercel সার্ভারলেস ফাংশন এক্সপোর্ট
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
    res.status(200).send('Telegram Calculator Bot is running on Vercel!');
  }
};
