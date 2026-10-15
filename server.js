const { Client, GatewayIntentBits, ActivityType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const express = require('express');

// سيرفر ويب لمنع Render من إيقاف الخدمة
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('ProBot is Online 24/7!'));
app.listen(PORT, () => console.log(`> Web server running on port ${PORT}`));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// عند جاهزية البوت
client.on('ready', () => {
    console.log(`> ✅ تم تسجيل الدخول بنجاح باسم: ${client.user.tag}`);
    
    client.user.setPresence({
        activities: [{ name: 'ProBot ✨ | !help', type: ActivityType.Streaming, url: 'https://www.twitch.tv/discord' }],
        status: 'online'
    });
});

// أوامر البوت
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!help' || message.content === '!اوامر') {
        const embed = new EmbedBuilder()
            .setColor('#5865f2')
            .setTitle('✨ قائمة أوامر البوت')
            .addFields(
                { name: '🪙 `!كريدت`', value: 'عرض رصيد الكريدت' },
                { name: '🚩 `!أعلام`', value: 'اختيار الرتب بالأزرار (للمشرفين)' },
                { name: '🤖 `!ping`', value: 'سرعة الاستجابة' }
            );
        return message.reply({ embeds: [embed] });
    }

    if (message.content === '!كريدت') {
        return message.reply('🪙 رصيدك الحالي هو: **1,000 كريدت**');
    }

    if (message.content === '!ping') {
        return message.reply(`🏓 Pong! **${client.ws.ping}ms**`);
    }

    if (message.content === '!أعلام') {
        if (!message.member.permissions.has('Administrator')) return message.reply('❌ للمشرفين فقط.');
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('role_saudi').setLabel('🇸🇦 السعودية').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('role_vip').setLabel('⭐ VIP').setStyle(ButtonStyle.Success)
        );
        return message.channel.send({ content: 'اختر رتبتك:', components: [row] });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId === 'role_saudi') await interaction.reply({ content: '✅ تم إعطاؤك رتبة السعودية!', ephemeral: true });
    if (interaction.customId === 'role_vip') await interaction.reply({ content: '⭐ تم إعطاؤك رتبة VIP!', ephemeral: true });
});

// محاولة تسجيل الدخول مع التقاط أي خطأ وطباعته بوضوح في الـ Logs
if (!process.env.BOT_TOKEN) {
    console.error('❌ تنبيه: متغير البيئة BOT_TOKEN غير موجود في Render!');
}

client.login(process.env.BOT_TOKEN).catch(err => {
    console.error('❌ خطأ فادح في تسجيل دخول البوت:', err.message);
});
