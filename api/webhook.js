const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');

// Vercel Environment Variable থেকে BOT_TOKEN গ্রহণ করা হবে
const bot = new Telegraf(process.env.BOT_TOKEN);

// আপনার OpenRouter API Key
const OPENROUTER_API_KEY = "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";

// মেমরি স্টোর করার জন্য অবজেক্ট (প্রতি চ্যাট আইডি অনুযায়ী সাম্প্রতিক মেসেজগুলো সেভ থাকবে)
const chatHistories = {};
const MAX_HISTORY_LENGTH = 10; // সর্বোচ্চ ১০টি মেসেজ মেমরিতে জমা রাখবে

// 🌟 স্টার্ট / ওয়েলকাম মেসেজ
bot.start(async (ctx) => {
  const userName = ctx.from.first_name || 'User';
  
  // চ্যাট শুরু হলে আগের মেমরি ক্লিয়ার করে দেওয়া
  chatHistories[ctx.chat.id] = [];
  
  const welcomeMessage = `
🤖 **Welcome, ${userName}!**

I am your **AI Assistant Chatbot** powered by OpenRouter. My default language is **English**, but you can chat with me in any language you prefer! I also remember our conversation context. 

💡 Feel free to ask me anything. Let's start chatting! 🚀
  `;

  return ctx.replyWithMarkdown(welcomeMessage, Markup.inlineKeyboard([
    [Markup.button.url('➕ Add me to your group', `https://t.me/${ctx.botInfo?.username || ''}?startgroup=true`)]
  ]));
});

// 🤖 OpenRouter থেকে রেসপন্স আনার ফাংশন (মেমরিসহ)
async function getAIResponse(chatId, userMessage) {
  try {
    // যদি এই চ্যাটের কোনো হিস্ট্রি না থাকে, তবে ইনিশিয়ালাইজ করুন
    if (!chatHistories[chatId]) {
      chatHistories[chatId] = [];
    }

    // ইউজার মেসেজ হিস্টরিতে যোগ করা
    chatHistories[chatId].push({ role: "user", content: userMessage });

    // মেমরি লিমি트 চেক করা (বেশি বড় হলে পুরোনো মেসেজ মুছে ফেলা)
    if (chatHistories[chatId].length > MAX_HISTORY_LENGTH) {
      chatHistories[chatId] = chatHistories[chatId].slice(-MAX_HISTORY_LENGTH);
    }

    // সিস্টেম প্রম্পট (ডিফল্ট ভাষা ইংরেজি)
    const systemPrompt = {
      role: "system",
      content: "You are a helpful, smart, and friendly AI assistant. Your default language is English. If the user speaks in English, reply in English. If they speak in another language (like Bengali), reply politely in that language."
    };

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openrouter/free", // আপনার নির্দিষ্ট করা ফ্রি মডেল রাউটার
        messages: [systemPrompt, ...chatHistories[chatId]]
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://vercel.com",
          "X-Title": "Telegram AI Bot with Memory",
          "Content-Type": "application/json"
        }
      }
    );

    const aiReply = response.data?.choices[0]?.message?.content || "Sorry, I couldn't get any response.";

    // বটের উত্তরও হিস্টরিতে সেভ করা (যাতে মেমরি মনে রাখতে পারে)
    chatHistories[chatId].push({ role: "assistant", content: aiReply });

    return aiReply;
  } catch (error) {
    console.error("OpenRouter API Error:", error?.response?.data || error.message);
    return "Sorry, I am having trouble connecting to the AI server right now. Please try again later.";
  }
}

// 💬 ব্যবহারকারীর মেসেজ প্রসেস করা
bot.on('text', async (ctx) => {
  try {
    const text = ctx.message.text;
    const chatId = ctx.chat.id;

    // কমান্ড হলে স্কিপ করা
    if (text.startsWith('/')) return;

    // টাইপিং ইন্ডিকেটর পাঠানো
    await ctx.sendChatAction('typing');

    // AI উত্তর তৈরি করা (মেমরিসহ)
    const aiReply = await getAIResponse(chatId, text);

    // উত্তর পাঠানো
    await ctx.reply(aiReply, { reply_to_message_id: ctx.message.message_id });

  } catch (error) {
    console.error("Message Handler Error:", error);
    ctx.reply("An error occurred. Please try again.");
  }
});

// ⚡ Vercel Serverless Function Wrapper
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
    res.status(200).send('Telegram AI Bot with Memory is Active!');
  }
};
