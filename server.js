const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const express = require('express');
const { QuickDB } = require('quick.db');

const db = new QuickDB();
const app = express();

app.use(express.urlencoded({ extended: true }));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.on('ready', () => {
    console.log(`> ProBot Bot is online as ${client.user.tag}`);
});

// ==================== [ أحداث البوت: الترحيب، الخروج، الرتب، الكريدت ] ====================

// دخول عضو جديد
client.on('guildMemberAdd', async (member) => {
    const guildId = member.guild.id;
    
    // إعطاء الرتبة التلقائية
    const autoRoleId = await db.get(`autorole_${guildId}`);
    if (autoRoleId) {
        const role = member.guild.roles.cache.get(autoRoleId);
        if (role) member.roles.add(role).catch(() => {});
    }

    // رسالة الترحيب Embed
    const welcomeEnabled = await db.get(`welcome_enabled_${guildId}`);
    const welcomeMsg = await db.get(`welcome_msg_${guildId}`) || 'أهلاً بك {user} في سيرفرنا!';
    const welcomeChannelId = await db.get(`welcome_channel_${guildId}`);

    if (welcomeEnabled && welcomeChannelId) {
        const channel = member.guild.channels.cache.get(welcomeChannelId);
        if (channel) {
            const embed = new EmbedBuilder()
                .setColor('#5865f2')
                .setTitle('✨ عضو جديد انضم إلينا!')
                .setDescription(welcomeMsg.replace('{user}', `<@${member.id}>`))
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();
            channel.send({ embeds: [embed] });
        }
    }
});

// خروج عضو
client.on('guildMemberRemove', async (member) => {
    const guildId = member.guild.id;
    const leaveEnabled = await db.get(`leave_enabled_${guildId}`);
    const leaveMsg = await db.get(`leave_msg_${guildId}`) || 'غادر العضو {user} السيرفر.';
    const leaveChannelId = await db.get(`leave_channel_${guildId}`);

    if (leaveEnabled && leaveChannelId) {
        const channel = member.guild.channels.cache.get(leaveChannelId);
        if (channel) {
            const embed = new EmbedBuilder()
                .setColor('#ed4245')
                .setTitle('👋 غادر أحد الأعضاء')
                .setDescription(leaveMsg.replace('{user}', `**${member.user.tag}**`))
                .setTimestamp();
            channel.send({ embeds: [embed] });
        }
    }
});

// أوامر البوت (الكريدت ونظام الأعلام بالأزرار)
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // نظام الكريدت
    if (message.content === '!كريدت' || message.content === '!credits') {
        let credits = await db.get(`credits_${message.author.id}`) || 500;
        const embed = new EmbedBuilder()
            .setColor('#f1c40f')
            .setTitle('💰 رصيد الكريدت الخاص بك')
            .setDescription(`لديك حالياً: **${credits} كريدت** 🪙`);
        message.reply({ embeds: [embed] });
    }

    // أمر إرسال الأعلام لاختيار الرتب بالأزرار
    if (message.content === '!أعلام' && message.member.permissions.has('Administrator')) {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('role_saudi').setLabel('🇸🇦 السعودية').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('role_vip').setLabel('⭐ VIP').setStyle(ButtonStyle.Success)
            );
        message.channel.send({ content: 'اختر رتبتك بالتفاعل عبر الأزرار أدناه:', components: [row] });
    }
});

// تفاعل الأزرار للرتب والأعلام
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId === 'role_saudi') {
        await interaction.reply({ content: 'تم منحك رتبة السعودية بنجاح! ✅', ephemeral: true });
    } else if (interaction.customId === 'role_vip') {
        await interaction.reply({ content: 'تم منحك رتبة VIP بنجاح! ⭐', ephemeral: true });
    }
});


// ==================== [ لوحة التحكم ProBot ✨ Dashboard ] ====================

app.get('/', async (req, res) => {
    const guild = client.guilds.cache.first();
    const guildId = guild ? guild.id : 'default';
    const guildName = guild ? guild.name : 'ProBot Server';
    const guildIcon = guild && guild.iconURL() ? guild.iconURL() : 'https://cdn.discordapp.com/embed/avatars/0.png';

    const welcomeMsg = (await db.get(`welcome_msg_${guildId}`)) || '';
    const welcomeChannel = (await db.get(`welcome_channel_${guildId}`)) || '';
    const leaveMsg = (await db.get(`leave_msg_${guildId}`)) || '';
    const leaveChannel = (await db.get(`leave_channel_${guildId}`)) || '';
    const autoRole = (await db.get(`autorole_${guildId}`)) || '';

    res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <title>ProBot ✨ | لوحة التحكم</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, sans-serif; }
            body { background-color: #0c0d10; color: #e3e5e8; display: flex; height: 100vh; overflow: hidden; }
            .sidebar { width: 280px; background: #12141a; border-left: 1px solid #1f232a; padding: 20px; display: flex; flex-direction: column; }
            .server-card { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #1f232a; margin-bottom: 20px; }
            .server-card img { width: 70px; height: 70px; border-radius: 50%; margin-bottom: 10px; border: 2px solid #5865f2; object-fit: cover; }
            .server-card h2 { font-size: 16px; color: #fff; }
            .nav-item { display: block; padding: 12px; color: #96989d; text-decoration: none; border-radius: 8px; margin-bottom: 8px; font-weight: 500; transition: 0.2s; }
            .nav-item.active, .nav-item:hover { background: #5865f2; color: #fff; }
            .content { flex: 1; padding: 40px; overflow-y: auto; }
            .form-box { background: #16181f; padding: 30px; border-radius: 12px; border: 1px solid #1f232a; max-width: 700px; margin-bottom: 30px; }
            .field { margin-bottom: 20px; }
            .field label { display: block; margin-bottom: 8px; color: #b9bbbe; font-size: 14px; font-weight: bold; }
            .field input, .field textarea { width: 100%; padding: 12px 15px; background: #0f1015; border: 1px solid #202225; border-radius: 8px; color: #fff; outline: none; font-size: 14px; }
            .field input:focus, .field textarea:focus { border-color: #5865f2; }
            .btn { background: #5865f2; color: #fff; border: none; padding: 12px 25px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 15px; transition: 0.2s; }
            .btn:hover { background: #4752c4; }
            .status-badge { display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 12px; background: #23a55a; color: #fff; margin-bottom: 20px; font-weight: bold; }
            h2.section-title { color: #fff; margin-bottom: 15px; font-size: 18px; border-right: 4px solid #5865f2; padding-right: 10px; }
        </style>
    </head>
    <body>
        <aside class="sidebar">
            <div class="server-card">
                <img src="${guildIcon}" alt="Icon">
                <h2>${guildName}</h2>
                <p style="font-size: 12px; color: #8a8d91; margin-top: 5px;">ProBot ✨ Dashboard</p>
            </div>
            <a href="#" class="nav-item active">⚙️ الترحيب والخروج</a>
        <main class="content">
            <span class="status-badge">● البوت والداشبورد متصلين 24/7</span>
            <h1 style="margin-bottom: 8px; color: #fff;">لوحة تحكم ProBot ✨</h1>
            <p style="color: #8a8d91; margin-bottom: 30px;">تحكم كامل بإعدادات سيرفرك وتطبيق التغييرات بشكل فوري.</p>

            <form action="/save" method="POST" class="form-box">
                <input type="hidden" name="guildId" value="${guildId}">
                
                <h2 class="section-title">إعدادات ترحيب الأعضاء (Welcome Embed)</h2>
                <div class="field">
                    <label>أيدي روم الترحيب (Welcome Channel ID)</label>
                    <input type="text" name="welcomeChannel" value="${welcomeChannel}" placeholder="مثال: 123456789012345678">
                </div>
                <div class="field">
                    <label>رسالة الترحيب (استخدم {user} لمنشن العضو)</label>
                    <textarea name="welcomeMsg" rows="3" placeholder="مرحباً بك {user} في سيرفرنا!">${welcomeMsg}</textarea>
                </div>

                <h2 class="

client.login(MTU2M);
