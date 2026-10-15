const { Client, GatewayIntentBits, ActivityType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const express = require('express');

// سيرفر ويب خفيف لمنع Render من إيقاف البوت
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

// عند اشتغال البوت
client.on('ready', () => {
    console.log(`> تم تسجيل الدخول بنجاح باسم: ${client.user.tag}`);
    
    // ضبط حالة Streaming (بث مباشر)
    client.user.setPresence({
        activities: [{ name: 'ProBot ✨ | !help', type: ActivityType.Streaming, url: 'https://www.twitch.tv/discord' }],
        status: 'online'
    });
});

// أوامر البوت داخل السيرفر
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // أمر المساعدة
    if (message.content === '!help' || message.content === '!اوامر') {
        const embed = new EmbedBuilder()
            .setColor('#5865f2')
            .setTitle('✨ قائمة أوامر البوت')
            .setDescription('إليك الأوامر المتاحة حالياً في السيرفر:')
            .addFields(
                { name: '🪙 `!كريدت` أو `!credits`', value: 'عرض رصيد الكريدت الخاص بك' },
                { name: '🚩 `!أعلام`', value: 'إرسال قائمة اختيار الرتب بالأزرار (للإدارة فقط)' },
                { name: '🤖 `!ping`', value: 'فحص سرعة استجابة البوت' }
            )
            .setFooter({ text: 'ProBot ✨ System' });
        return message.reply({ embeds: [embed] });
    }

    // أمر الكريدت
    if (message.content === '!كريدت' || message.content === '!credits') {
        const embed = new EmbedBuilder()
            .setColor('#f1c40f')
            .setTitle('🪙 نظام الكريدت')
            .setDescription(`رصيدك الحالي هو: **1,000 كريدت**`);
        return message.reply({ embeds: [embed] });
    }

    // أمر البينج
    if (message.content === '!ping') {
        return message.reply(`🏓 Pong! سرعة الاستجابة: **${client.ws.ping}ms**`);
    }

    // أمر الأعلام والرتب
    if (message.content === '!أعلام') {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ هذا الأمر للمشرفين فقط.');
        }
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('role_saudi').setLabel('🇸🇦 السعودية').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('role_vip').setLabel('⭐ VIP').setStyle(ButtonStyle.Success)
            );
        return message.channel.send({ content: 'اختر رتبتك بالتفاعل مع الأزرار التالية:', components: [row] });
    }
});

// تفاعل الأزرار
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId === 'role_saudi') {
        await interaction.reply({ content: '✅ تم إعطاؤك رتبة السعودية!', ephemeral: true });
    } else if (interaction.customId === 'role_vip') {
        await interaction.reply({ content: '⭐ تم إعطاؤك رتبة VIP!', ephemeral: true });
    }
});

client.login(process.env.BOT_TOKEN);
