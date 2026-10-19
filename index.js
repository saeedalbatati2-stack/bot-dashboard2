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
  res.send('Bot is online 24/7!');
});

app.listen(PORT, () => console.log(`Web server running on port ${PORT}`));

// ----------------------------------------------------
// 2. المتغيرات والتعريفات المهمة
// ----------------------------------------------------
const PREFIX = '!';
const VOICE_CHANNEL_ID = '1561057768834867371'; // أيدي الروم الصوتي

// ----------------------------------------------------
// 3. حدث التشغيل والدخول الصوتي
// ----------------------------------------------------
client.once('ready', async () => {
  console.log(`🟢 تم تشغيل البوت بنجاح: ${client.user.tag}`);

  client.user.setPresence({
    activities: [{
      name: '24/7 Voice & Support',
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

  // 3. أمر الترحيب (!welcome @مستخدم)
  if (command === 'welcome') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return;
    const member = message.mentions.members.first() || message.member;

    const embed = new EmbedBuilder()
      .setTitle('✨ مرحباً بك في السيرفر!')
      .setDescription(`أهلاً بك يا ${member} في سيرفرنا، نتمنى لك قضاء وقت ممتع معنا! 🌹`)
      .setColor('#2b2d31')
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setImage('PASTE_IMAGE_URL_HERE'); // ضع رابط الصورة المباشر هنا

    message.channel.send({ content: `${member}`, embeds: [embed] });
  }

  // 4. أمر الإمبد (!embed العنوان | الوصف)
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

  // 5. أمر الرول (!role @مستخدم @رول)
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

  // 6. أمر السجن (!jail @مستخدم)
  if (command === 'jail') {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return;
    const member = message.mentions.members.first();
    if (!member) return message.reply('⚠️ يرجى تحديد الشخص.');

    await member.timeout(24 * 60 * 60 * 1000, 'سجن إداري').catch(console.error);
    message.reply(`🔒 تم سجن ${member} لمدة 24 ساعة.`);
  }

  // 7. أمر التايم أوت (!timeout @مستخدم الدقائق)
  if (command === 'timeout') {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return;
    const member = message.mentions.members.first();
    const minutes = parseInt(args[1]);

    if (!member || !minutes) return message.reply('⚠️ الاستخدام: `!timeout @المستخدم عدد_الدقائق`');

    await member.timeout(minutes * 60 * 1000).catch(console.error);
    message.reply(`⏳ تم إعطاء تايم أوت لـ ${member} لمدة **${minutes}** دقيقة.`);
  }

  // 8. أمر الباند (!ban @مستخدم السبب)
  if (command === 'ban') {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return;
    const member = message.mentions.members.first();
    const reason = args.slice(1).join(' ') || 'بدون سبب';

    if (!member) return message.reply('⚠️ يرجى تحديد الشخص.');

    await member.ban({ reason }).catch(console.error);
    message.reply(`🔨 تم حظر ${member.user.tag}. السبب: ${reason}`);
  }
});

// ----------------------------------------------------
// 5. إدارة التفاعلات (Buttons & Modals)
// ----------------------------------------------------
client.on('interactionCreate', async (interaction) => {
  
  // --- A. الأزرار (Buttons) ---
  if (interaction.isButton()) {

    // 1. زر فتح تذكرة دعم
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

    // 2. زر فتح تذكرة تقديم على الإدارة
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

    // 3. زر إغلاق التكت
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

    // 4. أزرار قبول / رفض التقديم داخل التكت
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

  // --- B. النماذج الإلكترونية (Modals Submit) ---
  if (interaction.isModalSubmit()) {

    // 1. فتح تذكرة دعم بعد كتابة السبب
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
          { name: '📌 سبب التذكرة:', value: `\`\`\`${reason}\`\`\`` }
        )
        .setColor('#2b2d31')
        .setThumbnail(user.displayAvatarURL({ dynamic: true }));

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('close_ticket_modal').setLabel('🔒 إغلاق التذكرة').setStyle(ButtonStyle.Danger)
      );

      await ticketChannel.send({ content: `${user}`, embeds: [embed], components: [row] });
      return interaction.reply({ content: `✅ تم فتح تذكرة الدعم بنجاح: ${ticketChannel}`, ephemeral: true });
    }

    // 2. فتح تذكرة تقديم ورسالة الاستمارة بالداخل
    if (interaction.customId === 'apply_form_modal') {
      const name = interaction.fields.getTextInputValue('apply_name');
      const exp = interaction.fields.getTextInputValue('apply_exp');
      const time = interaction.fields.getTextInputValue('apply_time');
      const user = interaction.user;
      const guild = interaction.guild;

      const ticketChannel = await guild.channels.create({
        name: `apply-${user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
        ],
      });

      const embed = new EmbedBuilder()
        .setTitle('📝 طلب تقديم إداري')
        .addFields(
          { name: '👤 المتقدم:', value: `${user} (\`${user.id}\`)` },
          { name: '👤 الاسم والعمر:', value: name },
          { name: '💼 الخبرات الإدارية:', value: exp },
          { name: '⏰ التفرغ اليومي:', value: time },
          { name: '📌 حالة الطلب:', value: '⏳ قيد المراجعة' }
        )
        .setColor('#5865F2')
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`accept_apply_${user.id}`).setLabel('قبول').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`reject_apply_${user.id}`).setLabel('رفض').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('close_ticket_modal').setLabel('🔒 إغلاق التذكرة').setStyle(ButtonStyle.Secondary)
      );

      await ticketChannel.send({ content: `${user}`, embeds: [embed], components: [actionRow] });
      return interaction.reply({ content: `✅ تم إنشاء تذكرة التقديم بنجاح: ${ticketChannel}`, ephemeral: true });
    }

    // 3. إغلاق التكت مع السبب
    if (interaction.customId === 'ticket_close_reason_modal') {
      const closeReason = interaction.fields.getTextInputValue('ticket_close_reason');
      await interaction.reply({ content: `🔒 تم حفظ السبب: **${closeReason}**. جاري إغلاق التذكرة خلال 5 ثوانٍ...` });
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }

    // 4. معالجة قرار قبول أو رفض التقديم داخل التكت
    if (interaction.customId.startsWith('apply_decision_')) {
      const parts = interaction.customId.split('_');
      const type = parts[2]; 
      const targetUserId = parts[3];
      const reason = interaction.fields.getTextInputValue('decision_reason');

      const isAccept = type === 'accept';
      const statusText = isAccept ? '🟢 تم القبول' : '🔴 تم الرفض';
      const statusColor = isAccept ? '#57F287' : '#ED4245';

      const oldEmbed = interaction.message.embeds[0];
      const updatedEmbed = EmbedBuilder.from(oldEmbed)
        .setColor(statusColor)
        .spliceFields(4, 1, { name: '📌 حالة الطلب:', value: `${statusText} بواسطة ${interaction.user}` })
        .addFields({ name: '💬 السبب:', value: reason });

      await interaction.update({ embeds: [updatedEmbed], components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('close_ticket_modal').setLabel('🔒 إغلاق التذكرة').setStyle(ButtonStyle.Danger)
        )
      ] });

      // إرسال رسالة خاصة للمتقدم بالنتيجة
      const targetMember = await interaction.guild.members.fetch(targetUserId).catch(() => null);
      if (targetMember) {
        targetMember.send({
          content: `مرحباً ${targetMember}، تم **${isAccept ? 'قبول' : 'رفض'}** طلب تقديمك للإدارة.\n**السبب:** ${reason}`
        }).catch(() => {});
      }
    }
  }
});

client.login(process.env.TOKEN);
