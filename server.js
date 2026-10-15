const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const express = require('express');

// سيرفر وهمي بسيط جداً فقط عشان Render يثبت أن التطبيق شغال وما يقفله
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is Alive! 24/7'));
app.listen(PORT, () => console.log(`> Keep-alive server running on port ${PORT}`));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`> Bot is online as ${client.user.tag}`);
    
    // ضبط حالة البوت على Streaming (بث مباشر)
    client.user.setActivity('ProBot ✨', {
        type: ActivityType.Streaming,
        url: 'https://www.twitch.tv/discord' // تقدر تغير رابط التويتش لو حابب
    });
});

client.login(process.env.BOT_TOKEN);
