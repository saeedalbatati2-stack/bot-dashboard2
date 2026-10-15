const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Fly.io Bot is Alive!'));
app.listen(PORT, () => console.log(`> Web server running on port ${PORT}`));

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
    client.user.setPresence({
        activities: [{ name: 'ProBot ✨ | !help', type: ActivityType.Streaming, url: 'https://www.twitch.tv/discord' }],
        status: 'online'
    });
});

client.login(process.env.BOT_TOKEN);
