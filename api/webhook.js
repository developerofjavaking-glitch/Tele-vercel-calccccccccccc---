const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// 🔞 বিস্তৃত পর্নোগ্রাফিক ও অ্যাডাল্ট ডোমেইন/কীওয়ার্ড তালিকা
const pornKeywords = [
  // জনপ্রিয় সাইট ও নাম
  'porn', 'pornhub', 'xvideos', 'xvids', 'xnxx', 'redtube', 'youporn', 
  'xhamster', 'brazzers', 'stripchat', 'cam4', 'camsoda', 'chaturbate',
  'onlyfans', 'fansly', 'spankbang', 'eporner', 'tube8', 'hentai',
  'thumbzilla', 'beeg', 'heavy-r', 'motherless', 'jizz', 'bonga',
  
  // সাধারণ শব্দ ও এক্সটেনশন
  'sex', 'xxx', 'adult', 'nsfw', 'nude', 'strip', 'erotic', 'camshow',
  'fetish', 'dick', 'pussy', 'boobs', 'hentai', '.porn', '.xxx', '.adult'
];

// লিংক ডিটেক্ট করার রেগুলার এক্সপ্রেশন
const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}[^\s]*)/gi;

// স্টার্ট / ওয়েলকাম মেসেজ
bot.start(async (ctx) => {
  const userName = ctx.from.first_name || 'User';
  
  const welcomeMessage = `
✨ **স্বাগতম, ${userName}!** ✨

🛡️ **GuardBot** — আপনার গ্রুপ সুরক্ষার বিশ্বস্ত সহকারী।

আমি আপনার গ্রুপকে স্প্যামিং ও ক্ষতিকর লিংক থেকে সম্পূর্ণ নিরাপদ রাখতে তৈরি।

---

📌 **আমার মূল সুবিধাসমূহ:**
🚫 **অটোমেটিক লিংক রিমুভার:** মেম্বারদের পাঠানো সকল লিংক ডিলিট করে।
🔞 **পর্ন লিংক ফিল্টার:** অ্যাডাল্ট লিংক দিলে ডিলিট করে **১ মিনিটের জন্য মিউট** করে।
👑 **অ্যাডমিন সুরক্ষা:** Admin/Owner-দের কোনো মেসেজ ডিলিট বা ফিল্টার করা হয় না।
  `;

  return ctx.replyWithMarkdown(welcomeMessage, Markup.inlineKeyboard([
    [Markup.button.url('➕ আমাকে আপনার গ্রুপে যুক্ত করুন', `https://t.me/${ctx.botInfo?.username || ''}?startgroup=true`)]
  ]));
});

// গ্রুপ মেসেজ ফিল্টারিং লজিক
bot.on('message', async (ctx) => {
  try {
    if (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup') return;

    const message = ctx.message;
    const user = message.from;
    if (!user) return;

    // 👑 ১. সেন্ড করার ব্যক্তি Admin/Owner কি না তা চেক করা
    let isAdmin = false;
    try {
      const member = await ctx.telegram.getChatMember(ctx.chat.id, user.id);
      if (member.status === 'creator' || member.status === 'administrator') {
        isAdmin = true;
      }
    } catch (e) {
      console.error('Failed to get member status:', e);
    }

    // অ্যাডমিন হলে বট কোনো চেক করবে না
    if (isAdmin) return;

    // ২. মেসেজে লিংক আছে কিনা চেক করা
    const text = message.text || message.caption || '';
    const hasLinkEntities = message.entities && message.entities.some(e => e.type === 'url' || e.type === 'text_link');
    const hasRegexLink = urlRegex.test(text);

    if (hasLinkEntities || hasRegexLink) {
      const lowerText = text.toLowerCase();
      const isPornLink = pornKeywords.some(keyword => lowerText.includes(keyword));

      if (isPornLink) {
        // মেসেজ ডিলিট করা
        await ctx.deleteMessage(message.message_id).catch(() => {});

        // ১ মিনিটের জন্য মিউট করা
        const untilDate = Math.floor(Date.now() / 1000) + 60;
        await ctx.restrictChatMember(user.id, {
          until_date: untilDate,
          permissions: {
            can_send_messages: false,
            can_send_media_messages: false,
            can_send_polls: false,
            can_send_other_messages: false,
            can_add_web_page_previews: false
          }
        }).catch((err) => console.error('Restrict error:', err));

        // মিউটের নোটিফিকেশন দেওয়া
        const mentionName = `[${user.first_name}](tg://user?id=${user.id})`;
        await ctx.reply(`${mentionName}, 🚫 **অ্যাডাল্ট/নিষিদ্ধ লিংক শেয়ার করার কারণে আপনাকে ১ মিনিটের জন্য মিউট করা হয়েছে।**`, { parse_mode: 'Markdown' });

      } else {
        // সাধারণ লিংক হলে শুধু ডিলিট
        await ctx.deleteMessage(message.message_id).catch(() => {});
      }
    }
  } catch (error) {
    console.error('Error handling message:', error);
  }
});

// Vercel Serverless Function Wrapper
module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body, res);
      if (!res.headersSent) {
        res.status(200).json({ status: 'ok' });
      }
    } catch (error) {
      console.error('Webhook error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  } else {
    res.status(200).send('Telegram Bot is Active!');
  }
};
