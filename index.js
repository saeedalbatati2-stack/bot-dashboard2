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
  TextInputStyle
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
  res.send('Bot is online 24/7 in Voice & Managing Commands!');
});

app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

// ----------------------------------------------------
// 2. المتغيرات والتعريفات المهمة
// ----------------------------------------------------
const PREFIX = '!';
const VOICE_CHANNEL_ID = '1561057768834867371'; // أيدي الروم الصوتي
const APPLY_LOG_CHANNEL_ID = '1561625605643046955';

// ----------------------------------------------------
// 3. حدث التشغيل والدخول الصوتي وحالة Streaming
// ----------------------------------------------------
client.once('ready', async () => {
  console.log(`🟢 تم تشغيل البوت بنجاح باسم: ${client.user.tag}`);

  // وضع حالة البث (Streaming)
  client.user.setPresence({
    activities: [{
      name: '24/7 Voice & Moderation',
      type: ActivityType.Streaming,
      url: 'https://www.twitch.tv/discord'
    }],
    status: 'online'
  });

  // دالة الدخول إلى الروم الصوتي 24/7
  async function connectToVoiceChannel() {
    try {
      const channel = client.channels.cache.get(VOICE_CHANNEL_ID);
      if (!channel) return console.log('❌ لم يتم العثور على الروم الصوتي!');

      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: true,
        selfMute: true
      });

      connection.on(VoiceConnectionStatus.Ready, () => {
        console.log(`🔊 البوت متصل بالروم الصوتي بنجاح!`);
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
      console.error('خطأ في الروم الصوتي:', error);
    }
  }

  connectToVoiceChannel();
});

// ----------------------------------------------------
// 4. نظام الأوامر (Commands)
// ----------------------------------------------------
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // 1. أمر حذف الرسائل (!clear <العدد>)
  if (command === 'clear') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply('❌ ليس لديك صلاحية حذف الرسائل.');
    const count = parseInt(args[0]);
    if (!count || count < 1 || count > 100) return message.reply('⚠️ يرجى تحديد عدد بين 1 و 100.');
    
    await message.channel.bulkDelete(count, true).catch(() => {});
    const msg = await message.channel.send(`🗑️ تم حذف **${count}** رسالة بنجاح.`);
    setTimeout(() => msg.delete().catch(() => {}), 3000);
  }

  // 2. أمر إرسال لوحة التكت (!ticket)
  if (command === 'ticket') {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('❌ ليس لديك صلاحية.');
    
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('open_ticket').setLabel('🎫 فتح تكت').setStyle(ButtonStyle.Primary)
    );

    const embed = new EmbedBuilder()
      .setTitle('نظام الدعم الفني')
      .setDescription('اضغط على الزر بالأسفل لفتح تكت والتواصل مع الإدارة.')
      .setColor('#2b2d31');

    message.channel.send({ embeds: [embed], components: [row] });
  }

  // 3. أمر لوحة تقديم الإدارة (!apply)
  if (command === 'apply') {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply('❌ ليس لديك صلاحية.');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('start_apply').setLabel('📝 تقديم على الإدارة').setStyle(ButtonStyle.Success)
    );

    const embed = new EmbedBuilder()
      .setTitle('التقديم على طاقم الإدارة')
      .setDescription('إذا أردت الانضمام إلى الطاقم الإداري، اضغط على الزر بالأسفل وقم بتعبئة النموذج.')
      .setColor('#2b2d31');

    message.channel.send({ embeds: [embed], components: [row] });
  }

  // 4. أمر الإمبد (!embed العنوان | الوصف)
  if (command === 'embed') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply('❌ ليس لديك صلاحية.');
    const content = args.join(' ');
    const parts = content.split('|');
    if (parts.length < 2) return message.reply('⚠️ طريقة الاستخدام: `!embed العنوان | الوصف`');

    const embed = new EmbedBuilder()
      .setTitle(parts[0].trim())
      .setDescription(parts[1].trim())
      .setColor('#2b2d31');

    message.channel.send({ embeds: [embed] });
  }

  // 5. أمر إعطاء أو سحب رول (!role @مستخدم @رول)
  if (command === 'role') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) return message.reply('❌ ليس لديك صلاحية إدارة الرولات.');
    const member = message.mentions.members.first();
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);

    if (!member || !role) return message.reply('⚠️ طريقة الاستخدام: `!role @المستخدم @الرول`');

    if (member.roles.cache.has(role.id)) {
      await member.roles.remove(role);
      message.reply(`✅ تم سحب رول **${role.name}** من ${member}.`);
    } else {
      await member.roles.add(role);
      message.reply(`✅ تم إعطاء رول **${role.name}** لـ ${member}.`);
    }
  }

  // 6. أمر السجن (!jail @مستخدم) - يعطيه تايم أوت لمدة يوم بدون الحاجة لرول
  if (command === 'jail') {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('❌ ليس لديك صلاحية السجن.');
    const member = message.mentions.members.first();
    if (!member) return message.reply('⚠️ يرجى تحديد الشخص المراد سجنه.');

    await member.timeout(24 * 60 * 60 * 1000, 'سجن إداري').catch(console.error);
    message.reply(`🔒 تم سجن ${member} لمدة 24 ساعة (عزل وتايم أوت).`);
  }

  // 7. أمر التايم أوت (!timeout @مستخدم الدقائق)
  if (command === 'timeout') {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('❌ ليس لديك صلاحية التايم أوت.');
    const member = message.mentions.members.first();
    const minutes = parseInt(args[1]);

    if (!member || !minutes) return message.reply('⚠️ طريقة الاستخدام: `!timeout @المستخدم عدد_الدقائق`');

    await member.timeout(minutes * 60 * 1000).catch(console.error);
    message.reply(`⏳ تم إعطاء تايم أوت لـ ${member} لمدة **${minutes}** دقيقة.`);
  }

  // 8. أمر الباند (!ban @مستخدم السبب)
  if (command === 'ban') {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('❌ ليس لديك صلاحية الباند.');
    const member = message.mentions.members.first();
    const reason = args.slice(1).join(' ') || 'بدون سبب مذكور';

    if (!member) return message.reply('⚠️ يرجى تحديد الشخص المراد حظره.');

    await member.ban({ reason }).catch(console.error);
    message.reply(`🔨 تم حظر ${member.user.tag} بنجاح. السبب: ${reason}`);
  }
});

// ----------------------------------------------------
// 5. التفاعلات (Buttons & Modals & Tickets)
// ----------------------------------------------------
client.on('interactionCreate', async (interaction) => {
  // تفعيل فتح وإغلاق التكت
  if (interaction.isButton()) {
    if (interaction.customId === 'open_ticket') {
      const guild = interaction.guild;
      const user = interaction.user;

      const ticketChannel = await guild.channels.create({
        name: `ticket-${user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
        ],
      });

      const closeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('close_ticket').setLabel('🔒 إغلاق التكت').setStyle(ButtonStyle.Danger)
      );

      const embed = new EmbedBuilder()
        .setTitle('تكت جديدة')
        .setDescription('مرحباً بك! اكتب مشكلتك أو استفسارك هنا وسيقوم فريق الدعم بالرد عليك.')
        .setColor('#2b2d31');

      await ticketChannel.send({ content: `${user}`, embeds: [embed], components: [closeRow] });
      return interaction.reply({ content: `✅ تم فتح التكت: ${ticketChannel}`, ephemeral: true });
    }

    if (interaction.customId === 'close_ticket') {
      await interaction.reply('🔒 جاري إغلاق التكت خلال 5 ثوانٍ...');
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }

    // فتح نموذج التقديم
    if (interaction.customId === 'start_apply') {
      const modal = new ModalBuilder()
        .setCustomId('apply_modal')
        .setTitle('نموذج التقديم على الإدارة');

      const nameInput = new TextInputBuilder().setCustomId('apply_name').setLabel('الاسم والعمر').setStyle(TextInputStyle.Short).setRequired(true);
      const expInput = new TextInputBuilder().setCustomId('apply_exp').setLabel('خبراتك الإدارية السابقة').setStyle(TextInputStyle.Paragraph).setRequired(true);
      const timeInput = new TextInputBuilder().setCustomId('apply_time').setLabel('عدد الساعات اليومية المتفرغ لها').setStyle(TextInputStyle.Short).setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(nameInput),
        new ActionRowBuilder().addComponents(expInput),
        new ActionRowBuilder().addComponents(timeInput)
      );

      await interaction.showModal(modal);
    }
  }

  // استلام نتائج نموذج التقديم وإرسالها لغرفة الإدارة
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'apply_modal') {
      const name = interaction.fields.getTextInputValue('apply_name');
      const exp = interaction.fields.getTextInputValue('apply_exp');
      const time = interaction.fields.getTextInputValue('apply_time');

      const applyLogChannel = interaction.guild.channels.cache.get(APPLY_LOG_CHANNEL_ID);

      const embed = new EmbedBuilder()
        .setTitle('📥 تقديم إداري جديد')
        .addFields(
          { name: 'المتقدم:', value: `${interaction.user} (${interaction.user.tag})` },
          { name: 'الاسم والعمر:', value: name },
          { name: 'الخبرات السابقة:', value: exp },
          { name: 'التفرغ اليومي:', value: time }
        )
        .setColor('#5865F2')
        .setTimestamp();

      if (applyLogChannel) {
        await applyLogChannel.send({ embeds: [embed] });
      }

      await interaction.reply({ content: '✅ تم إرسال تقديمك بنجاح، بالتوفيق!', ephemeral: true });
    }
  }
});

client.login(process.env.TOKEN);
