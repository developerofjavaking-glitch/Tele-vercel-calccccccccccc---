const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// পর্নোগ্রাফিক বা অ্যাডাল্ট ওয়েবসাইটের কিছু সাধারণ কীওয়ার্ড বা ডোমেন (প্রয়োজনে আরও যোগ করতে পারেন)
const pornKeywords = [
  'porn', 'sex', 'xxx', 'adult', 'xvids', 'xnxx', 'redtube', 'pornhub', 
  'brazzers', 'camshows', 'strip', 'nude', 'nsfw', 'xhamster'
];

// লিংক চেনার জন্য রেগুলার এক্সপ্রেশন
const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}[^\s]*)/gi;

bot.start((ctx) => {
  ctx.reply('বটটি সক্রিয় রয়েছে! আমাকে টেলিগ্রাম গ্রুপের **Admin** হিসেবে যুক্ত করুন এবং Delete Messages পারমিশন দিন। আমি মেম্বারদের লিংক ডিলিট করব এবং পর্ন লিংক দিলে ১ মিনিটের জন্য মিউট করব।');
});

// গ্রুপে আসা প্রতিটি মেসেজ হ্যান্ডেল করা
bot.on('message', async (ctx) => {
  try {
    // শুধুমাত্র গ্রুপ বা সুপারগ্রুপের জন্য কাজ করবে
    if (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup') {
      return;
    }

    const message = ctx.message;
    const text = message.text || message.caption || '';
    const user = message.from;

    if (!user) return;

    // ১. প্রেরক Admin বা Owner কি না তা চেক করা
    const member = await ctx.telegram.getChatMember(ctx.chat.id, user.id);
    const isAdmin = member.status === 'creator' || member.status === 'administrator';

    // যদি ইউজার Admin বা Owner হন, তবে বট কোনো চেক বা ডিলিট করবে না
    if (isAdmin) {
      return;
    }

    // ২. মেসেজে কোনো লিংক আছে কিনা চেক করা
    const hasLink = urlRegex.test(text) || (message.entities && message.entities.some(e => e.type === 'url' || e.type === 'text_link'));

    if (hasLink) {
      // ৩. পর্ন সাইটের লিংক কি না চেক করা
      const lowerText = text.toLowerCase();
      const isPornLink = pornKeywords.some(keyword => lowerText.includes(keyword));

      if (isPornLink) {
        // পর্ন লিংক হলে মেসেজ ডিলিট করা
        await ctx.deleteMessage(message.message_id).catch(() => {});

        // ১ মিনিটের জন্য ইউজারকে মিউট (Restrict) করা
        const muteDuration = 60; // সেকেন্ডে (১ মিনিট)
        const untilDate = Math.floor(Date.now() / 1000) + muteDuration;

        await ctx.restrictChatMember(user.id, {
          until_date: untilDate,
          permissions: {
            can_send_messages: false,
            can_send_media_messages: false,
            can_send_polls: false,
            can_send_other_messages: false,
            can_add_web_page_previews: false
          }
        }).catch((err) => console.log('Restrict error:', err));

        // ইউজারকে মেনশন করে কারণ জানানো
        const mentionName = user.first_name ? `[${user.first_name}](tg://user?id=${user.id})` : 'ব্যবহারকারী';
        await ctx.reply(`${mentionName}, পর্নোগ্রাফিক বা নিষিদ্ধ লিংক শেয়ার করার কারণে আপনাকে ১ মিনিটের জন্য মিউট করা হয়েছে।`, { parse_mode: 'Markdown' });

      } else {
        // সাধারণ লিংক হলে শুধু মেসেজটি ডিলিট করা (কোনো মিউট বা ওয়ার্নিং ছাড়া বা চাইলে ওয়ার্নিং দিতে পারেন)
        await ctx.deleteMessage(message.message_id).catch(() => {});
      }
    }
  } catch (error) {
    console.error('Error processing message:', error);
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
    res.status(200).send('Telegram Link Remover Bot is running on Vercel!');
  }
};
