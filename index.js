const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent // ضروري لقراءة محتوى الرسائل والأوامر
  ]
});

// ----------------------------------------------------
// 1. سيرفر إكسبريس لإبقاء البوت شغال 24/7 على Render
// ----------------------------------------------------
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is online 24/7!');
});

app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

// ----------------------------------------------------
// 2. قوائم الصور والأيدي
// ----------------------------------------------------
const PREFIX = '!'; // بادئة الأوامر

const boysImages = [
  'https://example.com/boy1.jpg',
  'https://example.com/boy2.jpg'
];

const girlsImages = [
  'https://example.com/girl1.jpg',
  'https://example.com/girl2.jpg'
];

// أيدي الرومات للإرسال التلقائي كل 5 ثوانٍ
const BOYS_CHANNEL_ID = 'ضع_أيدي_روم_العيال_هنا';
const GIRLS_CHANNEL_ID = 'ضع_أيدي_روم_البنات_هنا';

// ----------------------------------------------------
// 3. نظام الأوامر (Command Handler)
// ----------------------------------------------------
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // أمر طلب صورة ولد فوراً (!ولد أو !boy)
  if (command === 'ولد' || command === 'boy') {
    const randomPic = boysImages[Math.floor(Math.random() * boysImages.length)];
    const embed = new EmbedBuilder()
      .setImage(randomPic)
      .setColor('#2b2d31');

    return message.reply({ embeds: [embed] });
  }

  // أمر طلب صورة بنت فوراً (!بنت أو !girl)
  if (command === 'بنت' || command === 'girl') {
    const randomPic = girlsImages[Math.floor(Math.random() * girlsImages.length)];
    const embed = new EmbedBuilder()
      .setImage(randomPic)
      .setColor('#2b2d31');

    return message.reply({ embeds: [embed] });
  }

  // أمر التأكد من تشغيل البوت (!ping)
  if (command === 'ping') {
    return message.reply(`Pong! 🏓 (${client.ws.ping}ms)`);
  }
});

// ----------------------------------------------------
// 4. التشغيل التلقائي كل 5 ثوانٍ
// ----------------------------------------------------
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);

  setInterval(async () => {
    // إرسال تلقائي للعيال
    const boysChannel = client.channels.cache.get(BOYS_CHANNEL_ID);
    if (boysChannel && boysImages.length > 0) {
      const randomPic = boysImages[Math.floor(Math.random() * boysImages.length)];
      const embed = new EmbedBuilder().setImage(randomPic).setColor('#2b2d31');
      boysChannel.send({ embeds: [embed] }).catch(() => {});
    }

    // إرسال تلقائي للبنات
    const girlsChannel = client.channels.cache.get(GIRLS_CHANNEL_ID);
    if (girlsChannel && girlsImages.length > 0) {
      const randomPic = girlsImages[Math.floor(Math.random() * girlsImages.length)];
      const embed = new EmbedBuilder().setImage(randomPic).setColor('#2b2d31');
      girlsChannel.send({ embeds: [embed] }).catch(() => {});
    }
  }, 5000);
});

client.login(process.env.TOKEN);
