const { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const express = require('express');

// ----------------------------------------------------
// 0. سيرفر Express لإبقاء المشروع شغال 24/7 على Render
// ----------------------------------------------------
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Both Voice and Command Bots are online 24/7!');
});

app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

// ====================================================
// 1. البوت الأول: البوت الصوتي (24 ساعة)
// ====================================================
const voiceBot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const VOICE_CHANNEL_ID = '1561057768834867371'; // أيدي الروم الصوتي

voiceBot.once('ready', async () => {
  console.log(`🟢 البوت الأول (الصوتي) شغال باسم: ${voiceBot.user.tag}`);

  async function connectToVoiceChannel() {
    try {
      const channel = voiceBot.channels.cache.get(VOICE_CHANNEL_ID);
      if (!channel) return console.log('❌ البوت الأول: لم يتم العثور على الروم الصوتي!');

      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: true,
        selfMute: true
      });

      connection.on(VoiceConnectionStatus.Ready, () => {
        console.log(`🔊 البوت الأول دخل الروم الصوتي بنجاح!`);
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
      console.error('خطأ في البوت الأول الصوتي:', error);
    }
  }

  connectToVoiceChannel();
});

// ====================================================
// 2. البوت الثاني: بوت الأوامر (تكت، صور عيال وبنات وأنمي، إمبد، حذف، رولات)
// ====================================================
const commandBot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const PREFIX = '!'; // تقدر تغير بادئة الأوامر لو حبيت

// قوائم روابط الصور (عبيها بالروابط اللي تعجبك)
const boysImages = [
  'https://example.com/boy1.jpg',
  'https://example.com/boy2.jpg'
];

const girlsImages = [
  'https://example.com/girl1.jpg',
  'https://example.com/girl2.jpg'
];

const animeImages = [
  'https://example.com/anime1.jpg',
  'https://example.com/anime2.jpg'
];

commandBot.once('ready', () => {
  console.log(`🤖 البوت الثاني (الأوامر) شغال باسم: ${commandBot.user.tag}`);
});

commandBot.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // 1. أمر صور العيال (!boy)
  if (command === 'boy') {
    const randomPic = boysImages[Math.floor(Math.random() * boysImages.length)];
    const embed = new EmbedBuilder().setImage(randomPic).setColor('#2b2d31');
    return message.reply({ embeds: [embed] });
  }

  // 2. أمر صور البنات (!girl)
  if (command === 'girl') {
    const randomPic = girlsImages[Math.floor(Math.random() * girlsImages.length)];
    const embed = new EmbedBuilder().setImage(randomPic).setColor('#2b2d31');
    return message.reply({ embeds: [embed] });
  }

  // 3. أمر صور الأنمي (!anime)
  if (command === 'anime') {
    const randomPic = animeImages[Math.floor(Math.random() * animeImages.length)];
    const embed = new EmbedBuilder().setImage(randomPic).setColor('#2b2d31');
    return message.reply({ embeds: [embed] });
  }

  // 4. أمر التكت (!ticket) - يرسل رسالة مع زر لفتح تكت
  if (command === 'ticket') {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('❌ ليس لديك صلاحية.');
    
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('create_ticket').setLabel('🎫 فتح تكت').setStyle(ButtonStyle.Primary)
    );

    const embed = new EmbedBuilder()
      .setTitle('نظام التكتات')
      .setDescription('اضغط على الزر بالأسفل لفتح تكت جديدة ومساعدة الإدارة.')
      .setColor('#5865F2');

    return message.channel.send({ embeds: [embed], components: [row] });
  }

  // 5. أمر الحذف (!clear <عدد>)
  if (command === 'clear') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply('❌ ما عندك صلاحية حذف الرسائل!');
    const count = parseInt(args[0]);
    if (!count || count < 1 || count > 100) return message.reply('⚠️ حدد عدد الرسائل المراد حذفها من 1 إلى 100.');
    
    await message.channel.bulkDelete(count, true).catch(() => {});
    const msg = await message.channel.send(`🗑️ تم حذف **${count}** رسالة بنجاح.`);
    setTimeout(() => msg.delete().catch(() => {}), 3000);
    return;
  }

  // 6. أمر الإمبد (!embed <العنوان> | <الوصف>)
  if (command === 'embed') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply('❌ ما عندك صلاحية.');
    const content = args.join(' ');
    const parts = content.split('|');
    if (parts.length < 2) return message.reply('⚠️ الاستخدام الصحيح: `!embed العنوان | الوصف`');

    const embed = new EmbedBuilder()
      .setTitle(parts[0].trim())
      .setDescription(parts[1].trim())
      .setColor('#2b2d31');

    return message.channel.send({ embeds: [embed] });
  }

  // 7. أمر إعطاء رول بالإنجليزية (!giverole @User @RoleName أو ID)
  if (command === 'giverole') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) return message.reply('❌ You don\'t have permission to manage roles!');
    
    const targetUser = message.mentions.members.first();
    const roleArg = args[1]; // أيدي الرول أو المنشن
    const targetRole = message.mentions.roles.first() || message.guild.roles.cache.get(roleArg);

    if (!targetUser || !targetRole) return message.reply('⚠️ Usage: `!giverole @User @Role`');

    try {
      await targetUser.roles.add(targetRole);
      return message.reply(`✅ Successfully gave **${targetRole.name}** to **{targetUser.user.tag}**.`);
    } catch (e) {
      return message.reply('❌ Failed to add role. Check my permissions or role position.');
    }
  }

  // 8. أمر سحب رول بالإنجليزية (!removerole @User @Role)
  if (command === 'removerole') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) return message.reply('❌ You don\'t have permission to manage roles!');
    
    const targetUser = message.mentions.members.first();
    const roleArg = args[1];
    const targetRole = message.mentions.roles.first() || message.guild.roles.cache.get(roleArg);

    if (!targetUser || !targetRole) return message.reply('⚠️ Usage: `!removerole @User @Role`');

    try {
      await targetUser.roles.remove(targetRole);
      return message.reply(`✅ Successfully removed **${targetRole.name}** from **{targetUser.user.tag}**.`);
    } catch (e) {
      return message.reply('❌ Failed to remove role. Check my permissions.');
    }
  }
});

// نظام تفاعل زر التكت (إنشاء روم تكت خاص)
commandBot.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'create_ticket') {
    const guild = interaction.guild;
    const user = interaction.user;

    const existingChannel = guild.channels.cache.find(c => c.name === `ticket-${user.username.toLowerCase()}`);
    if (existingChannel) {
      return interaction.reply({ content: `❌ لديك تكت مفتوحة مسبقاً: ${existingChannel}`, ephemeral: true });
    }

    const ticketChannel = await guild.channels.create({
      name: `ticket-${user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
      ],
    });

    const closeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('close_ticket').setLabel('🔒 قفل التكت').setStyle(ButtonStyle.Danger)
    );

    const embed = new EmbedBuilder()
      .setTitle('تكت جديدة')
      .setDescription('مرحباً بك! اكتب مشكلتك أو استفسارك وسيتم الرد عليك قريباً من قبل الإدارة.')
      .setColor('#5865F2');

    await ticketChannel.send({ content: `${user}`, embeds: [embed], components: [closeRow] });
    return interaction.reply({ content: `✅ تم فتح التكت بنجاح: ${ticketChannel}`, ephemeral: true });
  }

  if (interaction.customId === 'close_ticket') {
    const channel = interaction.channel;
    await interaction.reply({ content: '🔒 جاري إغلاق التكت خلال 5 ثوانٍ...' });
    setTimeout(() => channel.delete().catch(() => {}), 5000);
  }
});

// ====================================================
// 3. تسجيل الدخول بالتوكنين
// ====================================================
voiceBot.login(process.env.TOKEN);       // توكن البوت الصوتي الأول
commandBot.login(process.env.TOKEN2);    // توكن بوت الأوامر الثاني
