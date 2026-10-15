const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const { QuickDB } = require('quick.db');

const db = new QuickDB();
const app = express();

app.use(express.urlencoded({ extended: true }));

// ==================== [ إعدادات بوت ديسكورد ] ====================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.on('ready', () => {
    console.log(`> البوت شغال بنجاح باسم: ${client.user.tag}`);
});

// حدث دخول عضو جديد للسيرفر (يرسل الترحيب ويعطيه الرتبة تلقائياً بناءً على إعدادات الداشبورد)
client.on('guildMemberAdd', async (member) => {
    const welcomeMsg = await db.get(`welcome_${member.guild.id}`);
    const autoRoleId = await db.get(`autorole_${member.guild.id}`);

    // إعطاء الرتبة التلقائية
    if (autoRoleId) {
        const role = member.guild.roles.cache.get(autoRoleId);
        if (role) {
            member.roles.add(role).catch(err => console.log('خطأ في إعطاء الرتبة:', err));
        }
    }

    // إرسال رسالة الترحيب في أول شات كتابي
    if (welcomeMsg) {
        const channel = member.guild.channels.cache.find(c => c.isTextBased() && c.permissionsFor(member.guild.members.me).has('SendMessages'));
        if (channel) {
            const formattedMsg = welcomeMsg.replace('{user}', `<@${member.id}>`);
            channel.send(formattedMsg);
        }
    }
});

// ==================== [ إعدادات الداشبورد ] ====================

app.get('/', async (req, res) => {
    // نجيب أول سيرفر موجود فيه البوت للسهولة
    const guild = client.guilds.cache.first();
    
    const guildName = guild ? guild.name : 'Nexus Empire';
    const guildIcon = guild && guild.iconURL() ? guild.iconURL() : 'https://cdn.discordapp.com/embed/avatars/0.png';
    const memberCount = guild ? guild.memberCount : 0;
    const guildId = guild ? guild.id : 'default';

    // قراءة البيانات المحفوظة حالياً
    const currentWelcome = (await db.get(`welcome_${guildId}`)) || '';
    const currentAutoRole = (await db.get(`autorole_${guildId}`)) || '';

    res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <title>لوحة التحكم | ProBot Style</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, sans-serif; }
            body { background-color: #0c0d10; color: #e3e5e8; }
            .container { display: flex; height: 100vh; }
            .sidebar { width: 280px; background: #12141a; border-left: 1px solid #1f232a; padding: 20px; }
            .server-card { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #1f232a; margin-bottom: 20px; }
            .server-card img { width: 70px; height: 70px; border-radius: 50%; margin-bottom: 10px; border: 2px solid #5865f2; object-fit: cover; }
            .server-card h2 { font-size: 16px; color: #fff; }
            .nav-item { display: block; padding: 12px; color: #96989d; text-decoration: none; border-radius: 8px; margin-bottom: 8px; font-weight: 500; }
            .nav-item.active, .nav-item:hover { background: #5865f2; color: #fff; }
            .content { flex: 1; padding: 40px; overflow-y: auto; }
            .form-box { background: #16181f; padding: 30px; border-radius: 12px; border: 1px solid #1f232a; max-width: 650px; }
            .field { margin-bottom: 20px; }
            .field label { display: block; margin-bottom: 8px; color: #b9bbbe; font-size: 14px; }
            .field input { width: 100%; padding: 12px 15px; background: #0f1015; border: 1px solid #202225; border-radius: 8px; color: #fff; outline: none; font-size: 15px; }
            .field input:focus { border-color: #5865f2; }
            .btn { background: #5865f2; color: #fff; border: none; padding: 12px 25px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 15px; transition: 0.2s; }
            .btn:hover { background: #4752c4; }
            .status-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; background: #23a55a; color: #fff; margin-bottom: 15px; }
        </style>
    </head>
    <body>
        <div class="container">
            <aside class="sidebar">
                <div class="server-card">
                    <img src="${guildIcon}" alt="Icon">
                    <h2>${guildName}</h2>
                    <p style="font-size: 12px; color: #8a8d91; margin-top: 5px;">${memberCount} عضو</p>
                </div>
                <a href="#" class="nav-item active">إعدادات البوت</a>
                <a href="#" class="nav-item">الترحيب والرتب</a>
            </aside>
            <main class="content">
                <span class="status-badge">● البوت متصل وشغال</span>
                <h1 style="margin-bottom: 8px; color: #fff;">لوحة التحكم بالبوت</h1>
                <p style="color: #8a8d91; margin-bottom: 25px;">أي تعديل هنا يتطبق بداخل سيرفر الديسكورد فوراً.</p>

                <form action="/save" method="POST" class="form-box">
                    <input type="hidden" name="guildId" value="${guildId}">
                    
                    <div class="field">
                        <label>رسالة الترحيب (اكتب {user} لمنشن الشخص)</label>
                        <input type="text" name="welcomeMsg" value="${currentWelcome}" placeholder="أهلاً بك يا {user} في السيرفر!">
                    </div>
                    
                    <div class="field">
                        <label>ID الرتبة التلقائية (Auto Role ID)</label>
                        <input type="text" name="autoRole" value="${currentAutoRole}" placeholder="مثال: 123456789012345678">
                    </div>
                    
                    <button type="submit" class="btn">حفظ وتطبيق فوراً</button>
                </form>
            </main>
        </div>
    </body>
    </html>
    `);
});

// حفظ البيانات في الداتا بيز
app.post('/save', async (req, res) => {
    const { guildId, welcomeMsg, autoRole } = req.body;
    
    await db.set(`welcome_${guildId}`, welcomeMsg);
    await db.set(`autorole_${guildId}`, autoRole);
    
    res.redirect('/');
});

// تشغيل السيرفر والبوت
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`> الداشبورد شغال على البورت: ${PORT}`);
});

// توكن البوت يقرأه من متغيرات البيئة على Render
client.login(process.env.BOT_TOKEN);
