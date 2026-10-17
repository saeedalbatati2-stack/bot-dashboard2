const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const express = require('express');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates // ضروري جداً لدخول الروم الصوتي
  ]
});

// ----------------------------------------------------
// 1. سيرفر إكسبريس لإبقاء البوت شغال 24/7 على Render
// ----------------------------------------------------
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Voice Bot is online 24/7 in the voice channel!');
});

app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

// ----------------------------------------------------
// 2. إعدادات الروم الصوتي
// ----------------------------------------------------
const VOICE_CHANNEL_ID = 'https://discord.com/channels/1560818054315638957/1561057768834867371; // أيدي الروم الصوتي

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // دالة لدخول الروم الصوتي والبقاء فيه
  async function connectToVoiceChannel() {
    try {
      const channel = client.channels.cache.get(VOICE_CHANNEL_ID);
      if (!channel) {
        return console.log('❌ لم يتم العثور على الروم الصوتي! تأكد من الأيدي.');
      }

      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: true,  // وضع سماعات مغلقة (أفضل للبوتات)
        selfMute: true   // وضع ميوت لنفسه
      });

      connection.on(VoiceConnectionStatus.Ready, () => {
        console.log(`🟢 دخل البوت بنجاح إلى الروم الصوتي: ${channel.name}`);
      });

      // إعادة الاتصال تلقائياً إذا خرج أو حصل انقطاع
      connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
            entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
          ]);
        } catch (error) {
          console.log('⚠️ انقطع الاتصال بالروم، جاري إعادة المحاولة...');
          connection.destroy();
          setTimeout(connectToVoiceChannel, 5000); // محاولة إعادة الدخول بعد 5 ثوانٍ
        }
      });

    } catch (error) {
      console.error('خطأ أثناء محاولة دخول الروم الصوتي:', error);
    }
  }

  connectToVoiceChannel();
});

client.login(process.env.TOKEN);
