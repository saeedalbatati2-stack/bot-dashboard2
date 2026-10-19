const { 
  Client, 
  GatewayIntentBits, 
  ActivityType, 
  EmbedBuilder, 
  PermissionFlagsBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  AttachmentBuilder
} = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const express = require('express');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// ----------------------------------------------------
// 1. سيرفر Express لإبقاء البوت شغال 24/7 على Render
// ----------------------------------------------------
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is online 24/7!');
});

app.listen(PORT, () => console.log(`Web server running on port ${PORT}`));

// ----------------------------------------------------
// 2. المتغيرات والتعريفات المهمة (ضع الأيديات هنا)
// ----------------------------------------------------
const PREFIX = '!';

// ضع أيديات الرومات هنا مباشرة بين العلامتين ' '
let VOICE_CHANNEL_ID = '1561057768834867371';  // أيدي الروم الصوتي للبوت
let WELCOME_CHANNEL_ID = 'ضع_أيدي_روم_الترحيب_هنا'; // أيدي روم الترحيب التلقائي
let BOY_CHANNEL_ID = 'ضع_أيدي_روم_صور_العيال_هنا';   // أيدي روم صور العيال
let GIRL_CHANNEL_ID = 'ضع_أيدي_روم_صور_البنات_هنا';  // أيدي روم صور البنات
let ANIME_CHANNEL_ID = 'ضع_أيدي_روم_صور_الأنمي_هنا'; // أيدي روم صور الأنمي

// دالة جلب صور عشوائية مجانية
async function getRandomImage(type) {
  try {
    if (type === 'anime') {
      const res = await fetch('https://api.waifu.pics/sfw/waifu');
      const data = await res.json();
      return data.url;
    } else if (type === 'boy') {
      return `https://source.unsplash.com/featured/800x1000/?man,boy,portrait&sig=${Math.floor(Math.random() * 10000)}`;
    } else if (type === 'girl') {
      return `https://source.unsplash.com/featured/800x1000/?woman,girl,portrait&sig=${Math.floor(Math.random() * 10000)}`;
    }
  } catch (err) {
    console.error(`خطأ في جلب صورة ${type}:`, err);
    return null;
  }
}

// ----------------------------------------------------
// 3. حدث التشغيل، الدخول الصوتي، ونظام الصور التلقائي
// ----------------------------------------------------
client.once('ready', async () => {
  console.log(`🟢 تم تشغيل البوت بنجاح: ${client.user.tag}`);

  client.user.setPresence({
    activities: [{
      name: '24/7 Voice & Management',
      type: ActivityType.Streaming,
      url: 'https://www.twitch.tv/discord'
    }],
    status: 'online'
  });

  // الاتصال التلقائي بالروم الصوتي
  async function connectToVoiceChannel() {
    try {
      const channel = client.channels.cache.get(VOICE_CHANNEL_ID);
      if (!channel) return;

      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: true,
        selfMute: true
      });

      connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
            entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
          ]);
        } catch (error) {
          connection.destroy();
          setTimeout(connectToVoiceChannel, 5000);
        }
      });
    } catch (error) {
      console.error(error);
    }
  }
  connectToVoiceChannel();

  // تكرار إرسال الصور كل 10 دقائق (600,000 مللي ثانية)
  setInterval(async () => {
    // 1. صور عيال
    if (BOY_CHANNEL_ID && BOY_CHANNEL_ID !== '1561058994120826900') {
      const ch = client.channels.cache.get(BOY_CHANNEL_ID);
      if (ch) {
        const imgUrl = await getRandomImage('boy');
        if (imgUrl) {
          const embed = new EmbedBuilder().setTitle('📷 صورة اليوم (شباب)').setImage(imgUrl).setColor('#2b2d31');
          ch.send({ embeds: [embed] }).catch(() => {});
        }
      }
    }

    // 2. صور بنات
    if (GIRL_CHANNEL_ID && GIRL_CHANNEL_ID !== '1561058648216698890') {
      const ch = client.channels.cache.get(GIRL_CHANNEL_ID);
      if (ch) {
        const imgUrl = await getRandomImage('girl');
        if (imgUrl) {
          const embed = new EmbedBuilder().setTitle('📷 صورة اليوم (بنات)').setImage(imgUrl).setColor('#2b2d31');
          ch.send({ embeds: [embed] }).catch(() => {});
        }
      }
    }

    // 3. صور أنمي
    if (ANIME_CHANNEL_ID && ANIME_CHANNEL_ID !== '1561059067919859763') {
      const ch = client.channels.cache.get(ANIME_CHANNEL_ID);
      if (ch) {
        const imgUrl = await getRandomImage('anime');
        if (imgUrl) {
          const embed = new EmbedBuilder().setTitle('🎌 صورة اليوم (أنمي)').setImage(imgUrl).setColor('#2b2d31');
          ch.send({ embeds: [embed] }).catch(() => {});
        }
      }
    }
  }, 10 * 60 * 1000);
});

// ----------------------------------------------------
// 4. حدث الترحيب عند دخول عضو جديد للروم المحددة
// ----------------------------------------------------
client.on('guildMemberAdd', async (member) => {
  if (!WELCOME_CHANNEL_ID || WELCOME_CHANNEL_ID === '1561057210983911606') return;
  const welcomeChannel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
  if (!welcomeChannel) return;

  const file = new AttachmentBuilder('./welcome.png');

  const embed = new EmbedBuilder()
    .setTitle('✨ مرحباً بك في السيرفر!')
    .setDescription(`أهلاً بك يا ${member} في **${member.guild.name}**، نورت السيرفر! 🌹`)
    .setColor('#2b2d31')
    .setImage('attachment://welcome.png')
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 })) // صورة العضو في نهاية/جانب الإمبد
    .setTimestamp();

  welcomeChannel.send({ content: `${member}`, embeds: [embed], files: [file] }).catch(() => {});
});

// ----------------------------------------------------
// 5. نظام الأوامر (Commands)
// ----------------------------------------------------
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // تغيير الأيديات عن طريق الأوامر أيضاً إذا أحببت:
  if (command === 'welcome-id') {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
    const targetChannel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
    if (!targetChannel) return message.reply('⚠️ يرجى تحديد الروم أو كتابة الـ ID.');
    WELCOME_CHANNEL_ID = targetChannel.id;
    message.reply(`✅ تم تحديث روم الترحيب بنجاح: ${targetChannel}`);
  }

  if (command === 'boy-id') {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
    const targetChannel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
    if (!targetChannel) return message.reply('⚠️ يرجى تحديد الروم أو كتابة الـ ID.');
    BOY_CHANNEL_ID = targetChannel.id;
    message.reply(`✅ تم تحديث روم صور العيال بنجاح: ${targetChannel}`);
  }

  if (command === 'girl-id') {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
    const targetChannel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
    if (!targetChannel) return message.reply('⚠️ يرجى تحديد الروم أو كتابة الـ ID.');
    GIRL_CHANNEL_ID = targetChannel.id;
    message.reply(`✅ تم تحديث روم صور البنات بنجاح: ${targetChannel}`);
  }

  if (command === 'anime-id') {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
    const targetChannel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
    if (!targetChannel) return message.reply('⚠️ يرجى تحديد الروم أو كتابة الـ ID.');
    ANIME_CHANNEL_ID = targetChannel.id;
    message.reply(`✅ تم تحديث روم صور الأنمي بنجاح: ${targetChannel}`);
  }

  // 1. أمر حذف الرسائل (!clear <العدد>)
  if (command === 'clear') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply('❌ ليس لديك صلاحية حذف الرسائل.');
    }

    const count = parseInt(args[0]);
    if (!count || count < 1 || count > 100) {
      return message.reply('⚠️ يرجى تحديد عدد من 1 إلى 100.');
    }

    await message.delete().catch(() => {});

    try {
      const deleted = await message.channel.bulkDelete(count, true);
      const msg = await message.channel.send(`🗑️ تم حذف **${deleted.size}** رسالة بنجاح.`);
      setTimeout(() => msg.delete().catch(() => {}), 3000);
    } catch (err) {
      message.channel.send('❌ تعذر حذف بعض الرسائل (ربما مرت عليها أكثر من 14 يومًا).');
    }
  }

  // 2. أمر لوحة التكت والتقديم المدمجة (!ticket)
  if (command === 'ticket') {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
    
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('open_support_ticket').setLabel('🎫 الدعم والمساعدة').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('open_apply_ticket').setLabel('📝 التقديم على الإدارة').setStyle(ButtonStyle.Success)
    );

    const embed = new EmbedBuilder()
      .setTitle('مركز الدعم والتقديمات')
      .setDescription('يرجى اختيار القسم المناسب من الأسفل لفتح تذكرة خاصة والتواصل مع الإدارة.')
      .setColor('#2b2d31');

    message.channel.send({ embeds: [embed], components: [row] });
  }

  // 3. أمر الإمبد (!embed العنوان | الوصف)
  if (command === 'embed') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return;
    const content = args.join(' ');
    const parts = content.split('|');
    if (parts.length < 2) return message.reply('⚠️ الاستخدام: `!embed العنوان | الوصف`');

    const embed = new EmbedBuilder()
      .setTitle(parts[0].trim())
      .setDescription(parts[1].trim())
      .setColor('#2b2d31');

    message.channel.send({ embeds: [embed] });
  }

  // 4. أمر الرول (!role @مستخدم @رول)
  if (command === 'role') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) return;
    const member = message.mentions.members.first();
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);

    if (!member || !role) return message.reply('⚠️ الاستخدام: `!role @المستخدم @الرول`');

    if (member.roles.cache.has(role.id)) {
      await member.roles.remove(role);
      message.reply(`✅ تم سحب رول **${role.name}** من ${member}.`);
    } else {
      await member.roles.add(role);
      message.reply(`✅ تم إعطاء رول **${role.name}** لـ ${member}.`);
    }
  }

  // 5. أمر السجن (!jail @مستخدم)
  if (command === 'jail') {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return;
    const member = message.mentions.members.first();
    if (!member) return message.reply('⚠️ يرجى تحديد الشخص.');

    await member.timeout(24 * 60 * 60 * 1000, 'سجن إداري').catch(console.error);
    message.reply(`🔒 تم سجن ${member} لمدة 24 ساعة.`);
  }

  // 6. أمر التايم أوت (!timeout @مستخدم الدقائق)
  if (command === 'timeout') {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return;
    const member = message.mentions.members.first();
    const minutes = parseInt(args[1]);

    if (!member || !minutes) return message.reply('⚠️ الاستخدام: `!timeout @المستخدم عدد_الدقائق`');

    await member.timeout(minutes * 60 * 1000).catch(console.error);
    message.reply(`⏳ تم إعطاء تايم أوت لـ ${member} لمدة **${minutes}** دقيقة.`);
  }

  // 7. أمر الباند (!ban @مستخدم السبب)
  if (command === 'ban') {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return;
    const member = message.mentions.members.first();
