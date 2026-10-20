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
  SlashCommandBuilder,
  REST,
  Routes
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
  res.send('Meeo Giveaway Bot is Online 24/7!');
});

app.listen(PORT, () => console.log(`Web server running on port ${PORT}`));

// ----------------------------------------------------
// 2. المتغيرات والتعريفات المهمة
// ----------------------------------------------------
let VOICE_CHANNEL_ID = '1561057768834867371';  

// ----------------------------------------------------
// 3. تعريف أوامر السلاش (Slash Commands)
// ----------------------------------------------------
const commands = [
  new SlashCommandBuilder()
    .setName('info')
    .setDescription('عرض معلومات السيرفر للنشر'),

  new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('إرسال لوحة الدعم والتقديمات الإدارية'),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('حذف عدد معين من الرسائل')
    .addIntegerOption(option => 
      option.setName('amount')
        .setDescription('عدد الرسائل (من 1 إلى 100)')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('عرض سرعة استجابة البوت')
].map(command => command.toJSON());

// ----------------------------------------------------
// 4. حدث التشغيل وتعديل حالة البوت والتسجيل
// ----------------------------------------------------
client.once('ready', async () => {
  console.log(`🟢 تم تشغيل البوت بنجاح: ${client.user.tag}`);

  // ضبط الحالة إلى Online وتغيير النشاط إلى Playing Meeo Gievaway
  client.user.setPresence({
    activities: [{
      name: 'Meeo Gievaway',
      type: ActivityType.Playing
    }],
    status: 'online'
  });

  // تسجيل أوامر السلاش أوتوماتيكياً
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ تم تسجيل أوامر السلاش بنجاح!');
  } catch (error) {
    console.error('❌ خطأ في تسجيل الأوامر:', error);
  }

  // الاتصال الصوتي 24/7
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
// 5. إدارة التفاعلات والأوامر
// ----------------------------------------------------
client.on('interactionCreate', async (interaction) => {

  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;

    if (commandName === 'ping') {
      return interaction.reply({ content: `🏓 سرعة الاتصال: **${client.ws.ping}ms**`, ephemeral: true });
    }

    if (commandName === 'info') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ ليس لديك صلاحية.', ephemeral: true });
      }

      let invite = await interaction.channel.createInvite({ maxAge: 0, maxUses: 0 }).catch(() => null);
      let inviteLink = invite ? invite.url : `https://discord.gg/${interaction.guild.id}`;

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel(interaction.guild.name)
          .setStyle(ButtonStyle.Link)
          .setURL(inviteLink),
        new ButtonBuilder()
          .setCustomId('show_server_info_details')
          .setLabel('Info')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('ℹ️')
      );

      return interaction.reply({ content: `**${interaction.guild.name}** Server Information`, components: [row] });
    }

    if (commandName === 'ticket') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '❌ ليس لديك صلاحية.', ephemeral: true });
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('open_support_ticket').setLabel('🎫 الدعم والمساعدة').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('open_apply_ticket').setLabel('📝 التقديم على الإدارة').setStyle(ButtonStyle.Success)
      );

      const embed = new EmbedBuilder()
        .setTitle('مركز الدعم والتقديمات')
        .setDescription('يرجى اختيار القسم المناسب من الأسفل لفتح تذكرة خاصة والتواصل مع الإدارة.')
        .setColor('#2b2d31');

      return interaction.reply({ embeds: [embed], components: [row] });
    }

    if (commandName === 'clear') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return interaction.reply({ content: '❌ ليس لديك صلاحية.', ephemeral: true });
      }

      const amount = interaction.options.getInteger('amount');
      if (amount < 1 || amount > 100) {
        return interaction.reply({ content: '⚠️ اختر عدداً بين 1 و 100.', ephemeral: true });
      }

      const deleted = await interaction.channel.bulkDelete(amount, true).catch(() => null);
      if (!deleted) return interaction.reply({ content: '❌ تعذر حذف الرسائل.', ephemeral: true });

      return interaction.reply({ content: `🗑️ تم حذف **${deleted.size}** رسالة بنجاح.`, ephemeral: true });
    }
  }

  if (interaction.isButton()) {

    if (interaction.customId === 'show_server_info_details') {
      const owner = await interaction.guild.fetchOwner().catch(() => null);
      const ownerMention = owner ? `${owner} (\`${owner.user.tag}\`)` : 'غير معروف';

      let invite = await interaction.channel.createInvite({ maxAge: 0, maxUses: 0 }).catch(() => null);
      let inviteLink = invite ? invite.url : `https://discord.gg/${interaction.guild.id}`;

      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      });

      const infoText = `### Publish Information
**Published by :** ${ownerMention}
**Type :** server
**Server :** ${interaction.guild.name}
**Invite link :** ${inviteLink}
**Published at :** ${formattedDate}`;

      return interaction.reply({ content: infoText, ephemeral: true });
    }

    if (interaction.customId === 'open_support_ticket') {
      const modal = new ModalBuilder().setCustomId('support_reason_modal').setTitle('سبب فتح التذكرة');
      const reasonInput = new TextInputBuilder().setCustomId('ticket_reason').setLabel('اكتب سبب فتح التذكرة').setStyle(TextInputStyle.Paragraph).setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
      return interaction.showModal(modal);
    }

    if (interaction.customId === 'open_apply_ticket') {
      const modal = new ModalBuilder().setCustomId('apply_form_modal').setTitle('استمارة التقديم على الإدارة');
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
      const modal = new ModalBuilder().setCustomId('ticket_close_reason_modal').setTitle('سبب إغلاق التذكرة');
      const closeReasonInput = new TextInputBuilder().setCustomId('ticket_close_reason').setLabel('سبب الإغلاق').setStyle(TextInputStyle.Short).setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(closeReasonInput));
      return interaction.showModal(modal);
    }

    if (interaction.customId.startsWith('accept_apply_') || interaction.customId.startsWith('reject_apply_')) {
      const isAccept = interaction.customId.startsWith('accept_apply_');
      const userId = interaction.customId.replace(isAccept ? 'accept_apply_' : 'reject_apply_', '');

      const modal = new ModalBuilder()
        .setCustomId(`apply_decision_${isAccept ? 'accept' : 'reject'}_${userId}`)
        .setTitle(isAccept ? 'سبب قبول المتقدم' : 'سبب رفض المتقدم');

      const reasonInput = new TextInputBuilder().setCustomId('decision_reason').setLabel('اكتب السبب هنا').setStyle(TextInputStyle.Paragraph).setRequired(true);
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
      const timeString = `<t:${Math.floor(now.getTime() / 1000)}:T>`;

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

    if (interaction.customId === 'ticket_close_reason_modal') {
      const closeReason = interaction.fields.getTextInputValue('ticket_close_reason');
      await interaction.reply({ content: `🔒 تم حفظ السبب: **${closeReason}**. جاري إغلاق التذكرة خلال 5 ثوانٍ...` });
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }

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
