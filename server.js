const { Client, GatewayIntentBits, ActivityType } = require('discord.js');

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
