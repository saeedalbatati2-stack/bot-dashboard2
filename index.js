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

let VOICE_CHANNEL_ID = '1561057768834867371';  
let WELCOME_CHANNEL_ID = '1561057210983911606'; 
let BOY_CHANNEL_ID = '1561058994120826900';   
let GIRL_CHANNEL_ID = '1561058648216698890';  
let ANIME_CHANNEL_ID = '1561059067919859763'; 

// دالة جلب صور عشوائية مجانية ومباشرة
async function getRandomImage(type) {
  try {
    if (type === 'anime') {
      const res = await fetch('https://api.waifu.pics/sfw/waifu');
      const data = await res.json();
      return data.url;
    } else if (type === 'boy') {
      const res = await fetch('https://raw.githubusercontent.com/D3V-N1GHT/random-assets/main/boys.json').catch(() => null);
      if (res && res.ok) {
        const list = await res.json();
        return list[Math.floor(Math.random() * list.length)];
      }
      return `https://picsum.photos/800/1000?random=${Math.floor(Math.random() * 100000)}`;
    } else if (type === 'girl') {
      const res = await fetch('https://api.waifu.pics/sfw/neko');
      const data = await res.json();
      return data.url;
    }
  } catch (err) {
    console.error(`خطأ في جلب صورة ${type}:`, err);
    return null;
  }
}

// دالة إنشاء رسالة الصور مع الأزرار الثلاثة بالأيموجيات فقط
function createImageMessage(imgUrl, type) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setURL(imgUrl)
      .setEmoji('📥'),
    new ButtonBuilder()
      .setCustomId(`refresh_img_${type}`)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🔄'),
    new ButtonBuilder()
      .setCustomId('delete_img_msg')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🗑️')
  );

  return { content: imgUrl, components: [row] };
}

// ----------------------------------------------------
// 3. حدث التشغيل ونظام الصور التلقائي كل 10 دقائق
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

  // نظام النشر التلقائي للصور كل 10 دقائق
  setInterval(async () => {
    if (BOY_CHANNEL_ID && BOY_CHANNEL_ID !== 'ضع_أيدي_روم_صور_العيال_هنا') {
      const ch = client.channels.cache.get(BOY_CHANNEL_ID);
      if (ch) {
        const imgUrl = await getRandomImage('boy');
        if (imgUrl) ch.send(createImageMessage(imgUrl, 'boy')).catch(() => {});
      }
    }

    if (GIRL_CHANNEL_ID && GIRL_CHANNEL_ID !== 'ضع_أيدي_روم_صور_البنات_هنا') {
      const ch = client.channels.cache.get(GIRL_CHANNEL_ID);
      if (ch) {
        const imgUrl = await getRandomImage('girl');
        if (imgUrl) ch.send(createImageMessage(imgUrl, 'girl')).catch(() => {});
      }
    }

    if (ANIME_CHANNEL_ID && ANIME_CHANNEL_ID !== 'ضع_أيدي_روم_صور_الأنمي_هنا') {
      const ch = client.channels.cache.get(ANIME_CHANNEL_ID);
      if (ch) {
        const imgUrl = await getRandomImage('anime');
        if (imgUrl) ch.send(createImageMessage(imgUrl, 'anime')).catch(() => {});
      }
    }
  }, 10 * 60 * 1000);
});

// ----------------------------------------------------
// 4. حدث الترحيب التلقائي عند دخول عضو جديد
// ----------------------------------------------------
client.on('guildMemberAdd', async (member) => {
  if (!WELCOME_CHANNEL_ID || WELCOME_CHANNEL_ID === 'ضع_أيدي_روم_الترحيب_هنا') return;
  const welcomeChannel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
  if (!welcomeChannel) return;

  const file = new AttachmentBuilder('./welcome.png');

  const embed = new EmbedBuilder()
    .setTitle('✨ مرحباً بك في السيرفر!')
    .setDescription(`أهلاً بك يا ${member} في سيرفرنا، نتمنى لك قضاء وقت ممتع معنا! 🌹`)
    .setColor('#2b2d31')
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
    .setImage('attachment://welcome.png')
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

  // أمر الترحيب اليدوي (!welcome @مستخدم)
  if (command === 'welcome') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return;
    const member = message.mentions.members.first() || message.member;

    const file = new AttachmentBuilder('./welcome.png');

    const embed = new EmbedBuilder()
      .setTitle('✨ مرحباً بك في السيرفر!')
      .setDescription(`أهلاً بك يا ${member} في سيرفرنا، نتمنى لك قضاء وقت ممتع معنا! 🌹`)
      .setColor('#2b2d31')
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
      .setImage('attachment://welcome.png')
      .setTimestamp();

    message.channel.send({ content: `${member}`, embeds: [embed], files: [file] }).catch(() => {});
  }

  // أوامر تحديد أيديات القنوات
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

  // أمر مسح الرسائل (!clear <العدد>)
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
      message.channel.send('❌ تعذر حذف بعض الرسائل.');
    }
  }

  // أمر لوحة التذاكر والتقديم (!ticket)
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

  // أمر الإمبد (!embed العنوان | الوصف)
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
});

// ----------------------------------------------------
// 6. إدارة التفاعلات (Buttons & Modals)
// ----------------------------------------------------
client.on('interactionCreate', async (interaction) => {
  
  if (interaction.isButton()) {

    // زر تغيير الصورة فوراً (🔄)
    if (interaction.customId.startsWith('refresh_img_')) {
      const type = interaction.customId.replace('refresh_img_', '');
      await interaction.deferUpdate();
      const newImgUrl = await getRandomImage(type);
      if (newImgUrl) {
        const msgData = createImageMessage(newImgUrl, type);
        await interaction.editReply(msgData);
      }
      return;
    }

    // زر حذف الصورة (🗑️)
    if (interaction.customId === 'delete_img_msg') {
      return interaction.message.delete().catch(() => {});
    }

    // تفاعلات التذاكر والتقديمات
    if (interaction.customId === 'open_support_ticket') {
      const modal = new ModalBuilder()
        .setCustomId('support_reason_modal')
        .setTitle('سبب فتح التذكرة');

      const reasonInput = new TextInputBuilder()
        .setCustomId('ticket_reason')
        .setLabel('اكتب سبب فتح التذكرة')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
      return interaction.showModal(modal);
    }

    if (interaction.customId === 'open_apply_ticket') {
      const modal = new ModalBuilder()
        .setCustomId('apply_form_modal')
        .setTitle('استمارة التقديم على الإدارة');

      const nameInput = new TextInputBuilder().setCustomId('apply_name').setLabel('الاسم والعمر').setStyle(TextInputStyle.Short).setRequired(true);
      const expInput = new TextInputBuilder().setCustomId('apply_exp').setLabel('خبراتك الإدارية السابقة').setStyle(TextInputStyle.Paragraph).setRequired(true);
      const timeInput = new TextInputBuilder().setCustomId('apply_time').setLabel('عدد الساعات اليومية المتفرغ لها').setStyle(TextInputStyle.Short).setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(nameInput),
        new ActionRowBuilder().addComponents(expInput),
        new ActionRowBuilder().addComponents(timeInput)
      );
      return interaction.showModal(modal);
    }

    if (interaction.customId === 'close_ticket_modal') {
      const modal = new ModalBuilder()
        .setCustomId('ticket_close_reason_modal')
        .setTitle('سبب إغلاق التذكرة');

      const closeReasonInput = new TextInputBuilder()
        .setCustomId('ticket_close_reason')
        .setLabel('سبب إغلاق التذكرة')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(closeReasonInput));
      return interaction.showModal(modal);
    }

    if (interaction.customId.startsWith('accept_apply_') || interaction.customId.startsWith('reject_apply_')) {
      const isAccept = interaction.customId.startsWith('accept_apply_');
      const userId = interaction.customId.replace(isAccept ? 'accept_apply_' : 'reject_apply_', '');

      const modal = new ModalBuilder()
        .setCustomId(`apply_decision_${isAccept ? 'accept' : 'reject'}_${userId}`)
        .setTitle(isAccept ? 'سبب قبول المتقدم' : 'سبب رفض المتقدم');

      const reasonInput = new TextInputBuilder()
        .setCustomId('decision_reason')
        .setLabel('اكتب السبب هنا')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
      return interaction.showModal(modal);
    }
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'support_reason_modal') {
      const reason = interaction.fields.getTextInputValue('ticket_reason');
      const user = interaction.user;
      const guild = interaction.guild;

      const ticketChannel = await guild.channels.create({
        name: `ticket-${user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
        ],
      });

      const now = new Date();
      const timeString = `<t:${Math.floor(now.getTime() / 1000)}:T> (<t:${Math.floor(now.getTime() / 1000)}:R>)`;

      const embed = new EmbedBuilder()
        .setTitle(`🎫 تذكرة دعم: ${user.username}`)
        .setDescription(`مرحباً بك ${user} في تذكرتك، انتظر رد طاقم الدعم.`)
        .addFields(
          { name: '👤 صاحب التكت:', value: `${user} (\`${user.id}\`)`, inline: true },
          { name: '⏰ وقت الفتح:', value: timeString, inline: true },
          { name: '📌 سبب التذكرة:', value: `\`\`\`${reason}\`\`\
