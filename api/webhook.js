const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// পর্নোগ্রাফিক বা অ্যাডাল্ট ওয়েবসাইটের কীওয়ার্ড
const pornKeywords = [
  'porn', 'sex', 'xxx', 'adult', 'xvids', 'xnxx', 'redtube', 'pornhub', 
  'brazzers', 'camshows', 'strip', 'nude', 'nsfw', 'xhamster'
];

// লিংক চেনার জন্য রেগুলার এক্সপ্রেশন
const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}[^\s]*)/gi;

// 🌟 প্রিমিয়াম স্টার্ট/ওয়েলকাম মেসেজ
bot.start(async (ctx) => {
  const userName = ctx.from.first_name || 'User';
  
  const welcomeMessage = `
✨ **স্বাগতম, ${userName}!** ✨

🛡️ **GuardBot** — আপনার গ্রুপ সুরক্ষার বিশ্বস্ত সহকারী।

আমি আপনার গ্রুপকে স্প্যামিং ও ক্ষতিকর লিংক থেকে সম্পূর্ণ নিরাপদ রাখতে তৈরি।

---

📌 **আমার মূল সুবিধাসমূহ:**
🚫 **অটোমেটিক লিংক রিমুভার:** গ্রুপে মেম্বারদের পাঠানো সকল লিংক সাথে সাথে ডিলিট করে দেয়।
🔞 **পর্ন লিংক ফিল্টার:** কোনো অ্যাডাল্ট লিংক দিলে সাথে সাথে ডিলিট এবং ওই মেম্বারকে **১ মিনিটের জন্য মিউট** করে দেয়।
👑 **অ্যাডমিন সুরক্ষা:** গ্রুপের Owner বা Admin-দের কোনো মেসেজ ফিল্টার বা ডিলিট করা হয় না।

---

💡 **কীভাবে সেটআপ করবেন?**
১. আপনার গ্রুপে আমাকে **Admin** হিসেবে যুক্ত করুন।
২. **Delete Messages** এবং **Restrict Members** পারমিশন দিন।
  `;

  return ctx.replyWithMarkdown(welcomeMessage, Markup.inlineKeyboard([
    [Markup.button.url('➕ আমাকে আপনার গ্রুপে যুক্ত করুন', `https://t.me/${ctx.botInfo.username}?startgroup=true`)],
    [Markup.button.url('📢 আপডেট চ্যানেল', 'https://t.me'), Markup.button.url('💬 সাপোর্ট গ্রুপ', 'https://t.me')]
  ]));
});

// গ্রুপে আসা প্রতিটি মেসেজ হ্যান্ডেল করা
bot.on('message', async (ctx) => {
  try {
    if (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup') {
      return;
    }

    const message = ctx.message;
    const text = message.text || message.caption || '';
    const user = message.from;

    if (!user) return;

    // ১. Admin/Owner চেক
    const member = await ctx.telegram.getChatMember(ctx.chat.id, user.id);
    const isAdmin = member.status === 'creator' || member.status === 'administrator';

    if (isAdmin) {
      return;
    }

    // ২. লিংক ডিটেকশন
    const hasLink = urlRegex.test(text) || (message.entities && message.entities.some(e => e.type === 'url' || e.type === 'text_link'));

    if (hasLink) {
      // ৩. পর্ন লিংক চেক
      const lowerText = text.toLowerCase();
      const isPornLink = pornKeywords.some(keyword => lowerText.includes(keyword));

      if (isPornLink) {
        await ctx.deleteMessage(message.message_id).catch(() => {});

        const muteDuration = 60; // ১ মিনিট
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

        const mentionName = `[${user.first_name}](tg://user?id=${user.id})`;
        await ctx.reply(`${mentionName}, 🚫 **অ্যাডাল্ট/নিষিদ্ধ লিংক শেয়ার করার কারণে আপনাকে ১ মিনিটের জন্য মিউট করা হয়েছে।**`, { parse_mode: 'Markdown' });

      } else {
        // সাধারণ লিংক ডিলিট
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
