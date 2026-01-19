const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, SlashCommandBuilder } = require('discord.js');
const { ChannelType } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const config = {
  photoChannelId: 'AboneSSKanalİd',
  logChannelId: 'LogKanalİd',
  subscriberRoleId: 'AboneRolİd',
  staffRoleId: 'AboneStaffİd',
  sunucuid: "Sunucuİd",
  sesid: "Sesİd",
  token: "Botun Tokeni"
};

// Fotoğrafları geçici olarak saklamak için
const pendingPhotos = new Map();

// İstatistikleri saklamak için
const stats = new Map();

// İstatistik yükleme/kaydetme fonksiyonları
function loadStats() {
  try {
    const fs = require('fs');
    if (fs.existsSync('./stats.json')) {
      const data = fs.readFileSync('./stats.json', 'utf8');
      const parsed = JSON.parse(data);
      Object.entries(parsed).forEach(([key, value]) => {
        stats.set(key, value);
      });
      console.log('İstatistikler yüklendi');
    }
  } catch (err) {
    console.log('İstatistik yükleme hatası:', err);
  }
}

function saveStats() {
  try {
    const fs = require('fs');
    const obj = Object.fromEntries(stats);
    fs.writeFileSync('./stats.json', JSON.stringify(obj, null, 2));
  } catch (err) {
    console.log('İstatistik kaydetme hatası:', err);
  }
}

function updateStats(userId, action) {
  const key = `${userId}`;
  const userStats = stats.get(key) || { approved: 0, rejected: 0 };
  
  if (action === 'approve') {
    userStats.approved++;
  } else if (action === 'reject') {
    userStats.rejected++;
  }
  
  stats.set(key, userStats);
  saveStats();
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== config.photoChannelId) return;

  // Fotoğraf kontrolü
  if (message.attachments.size === 0 || !message.attachments.first().contentType?.startsWith('image/')) {
    // Mesajı sil
    await message.delete();
    
    // Kullanıcıya DM gönder
    try {
      await message.author.send('⚠️ Bu kanalda sadece fotoğraf paylaşabilirsiniz! Lütfen sadece fotoğraf atın.');
    } catch (err) {
      console.log('DM gönderilemedi');
    }
    return;
  }

  const attachment = message.attachments.first();
  const user = message.author;

  // Embed oluştur
  const embed = new EmbedBuilder()
    .setTitle('📸 Yeni Fotoğraf Onay Talebi')
    .setDescription(`**Kullanıcı:** ${user.tag}\n**ID:** ${user.id}`)
    .setImage(attachment.url)
    .setColor('#9333ea')
    .setTimestamp()
    .setFooter({ text: 'Fotoğraf Onay Sistemi' });

  // Butonlar
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`approve_${user.id}`)
        .setLabel('Onayla')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅'),
      new ButtonBuilder()
        .setCustomId(`reject_${user.id}`)
        .setLabel('Reddet')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌')
    );

  // Embed gönder (fotoğraf embed içinde zaten var)
  const embedMessage = await message.channel.send({ 
    embeds: [embed], 
    components: [row] 
  });

  // Fotoğraf URL'sini ve orijinal mesajı sakla
  pendingPhotos.set(embedMessage.id, {
    url: attachment.url,
    originalMessage: message
  });

  // Staff rolüne sahip herkese DM gönder
  try {
    const staffRole = message.guild.roles.cache.get(config.staffRoleId);
    if (staffRole) {
      const staffMembers = staffRole.members;
      
      const notificationEmbed = new EmbedBuilder()
        .setTitle('🔔 Yeni Abone SS Talebi')
        .setDescription(`**${user.tag}** tarafından yeni bir fotoğraf onayı bekliyor!\n\n[Mesaja Git](${embedMessage.url})`)
        .setThumbnail(user.displayAvatarURL())
        .setColor('#9333ea')
        .setTimestamp();

      for (const [, member] of staffMembers) {
        if (!member.user.bot) {
          try {
            await member.send({ embeds: [notificationEmbed] });
          } catch (err) {
            console.log(`${member.user.tag} kullanıcısına DM gönderilemedi`);
          }
        }
      }
    }
  } catch (err) {
    console.log('Staff bildirim hatası:', err);
  }
});

client.on('interactionCreate', async (interaction) => {
  // Slash komutları
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'stats') {
      const member = interaction.member;
      
      // Staff yetkisi kontrolü
      if (!member.roles.cache.has(config.staffRoleId) && !member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ 
          content: '❌ Bu komutu kullanmak için yetkiniz yok!', 
          ephemeral: true 
        });
      }

      // İstatistikleri sırala
      const sortedStats = Array.from(stats.entries())
        .map(([userId, data]) => ({
          userId,
          approved: data.approved,
          rejected: data.rejected,
          total: data.approved + data.rejected
        }))
        .sort((a, b) => b.total - a.total);

      if (sortedStats.length === 0) {
        return interaction.reply({
          content: '📊 Henüz istatistik yok.',
          ephemeral: true
        });
      }

      // Embed oluştur
      const statsEmbed = new EmbedBuilder()
        .setTitle('📊 Yetkili İstatistikleri')
        .setColor('#9333ea')
        .setTimestamp();

      let description = '';
      for (let i = 0; i < Math.min(10, sortedStats.length); i++) {
        const stat = sortedStats[i];
        const user = await client.users.fetch(stat.userId).catch(() => null);
        const username = user ? user.tag : `Kullanıcı ${stat.userId}`;
        
        description += `**${i + 1}. ${username}**\n`;
        description += `✅ Onay: ${stat.approved} | ❌ Red: ${stat.rejected} | 📈 Toplam: ${stat.total}\n\n`;
      }

      statsEmbed.setDescription(description);

      await interaction.reply({
        embeds: [statsEmbed],
        ephemeral: true
      });
    }
  }

  // Buton tıklaması
  if (interaction.isButton()) {
    const member = interaction.member;
    
    // Staff yetkisi kontrolü
    if (!member.roles.cache.has(config.staffRoleId) && !member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ 
        content: '❌ Bu işlemi yapmak için yetkiniz yok!', 
        ephemeral: true 
      });
    }

    const [action, userId] = interaction.customId.split('_');
    const guild = interaction.guild;
    const targetMember = await guild.members.fetch(userId);
    const moderator = interaction.user;
    
    // Fotoğrafı al
    const photoData = pendingPhotos.get(interaction.message.id);
    const imageUrl = photoData?.url;

    if (action === 'approve') {
      // İstatistiği güncelle
      updateStats(moderator.id, 'approve');

      // Rol ver
      await targetMember.roles.add(config.subscriberRoleId);

      // Kullanıcıya DM gönder
      try {
        await targetMember.send('✅ Fotoğrafınız onaylandı! Abone rolü verildi.');
      } catch (err) {
        console.log('DM gönderilemedi');
      }

      // Log kaydı - fotoğraf eklendi
      const logChannel = guild.channels.cache.get(config.logChannelId);
      const logEmbed = new EmbedBuilder()
        .setTitle('✅ Fotoğraf Onaylandı')
        .setDescription(`**Onaylayan:** ${moderator}\n**Onaylanan:** ${targetMember}`)
        .setThumbnail(targetMember.user.displayAvatarURL())
        .setImage(imageUrl)
        .setColor('#22c55e')
        .setTimestamp();
      
      await logChannel.send({ embeds: [logEmbed] });

      // Mesajı güncelle - fotoğrafı koruyalım
      const updatedEmbed = new EmbedBuilder()
        .setTitle('✅ Onaylandı!')
        .setDescription(`**Onaylayan:** ${moderator.tag}`)
        .setImage(imageUrl)
        .setColor('#22c55e')
        .setTimestamp();

      await interaction.update({ 
        embeds: [updatedEmbed], 
        components: [] 
      });

      // Orijinal mesajı sil
      try {
        if (photoData?.originalMessage) {
          await photoData.originalMessage.delete();
        }
      } catch (err) {
        console.log('Orijinal mesaj silinemedi:', err);
      }

      // Fotoğrafı Map'ten temizle
      pendingPhotos.delete(interaction.message.id);

    } else if (action === 'reject') {
      // Modal oluştur
      const modal = new ModalBuilder()
        .setCustomId(`reject_modal_${userId}`)
        .setTitle('Fotoğraf Reddetme Sebebi');

      const reasonInput = new TextInputBuilder()
        .setCustomId('reject_reason')
        .setLabel('Red sebebini yazın:')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Örnek: Fotoğraf bulanık, yüzünüz net görünmüyor...')
        .setRequired(true)
        .setMinLength(3)
        .setMaxLength(500);

      const actionRow = new ActionRowBuilder().addComponents(reasonInput);
      modal.addComponents(actionRow);

      await interaction.showModal(modal);
    }
  }

  // Modal gönderimi
  if (interaction.isModalSubmit()) {
    if (interaction.customId.startsWith('reject_modal_')) {
      const userId = interaction.customId.replace('reject_modal_', '');
      const reason = interaction.fields.getTextInputValue('reject_reason');

      const guild = interaction.guild;
      const targetMember = await guild.members.fetch(userId);
      const moderator = interaction.user;
      
      // İstatistiği güncelle
      updateStats(moderator.id, 'reject');

      // Fotoğrafı al
      const photoData = pendingPhotos.get(interaction.message.id);
      const imageUrl = photoData?.url;

      // Kullanıcıya DM gönder
      try {
        const dmEmbed = new EmbedBuilder()
          .setTitle('❌ Fotoğrafınız Reddedildi')
          .setDescription(`**Sebep:**\n${reason}`)
          .setColor('#ef4444')
          .setTimestamp();
        
        await targetMember.send({ embeds: [dmEmbed] });
      } catch (err) {
        console.log('DM gönderilemedi');
      }

      // Log kaydı - fotoğraf eklendi
      const logChannel = guild.channels.cache.get(config.logChannelId);
      const logEmbed = new EmbedBuilder()
        .setTitle('❌ Fotoğraf Reddedildi')
        .setDescription(`**Reddeden:** ${moderator}\n**Reddedilen:** ${targetMember}\n\n**Sebep:**\n${reason}`)
        .setThumbnail(targetMember.user.displayAvatarURL())
        .setImage(imageUrl)
        .setColor('#ef4444')
        .setTimestamp();
      
      await logChannel.send({ embeds: [logEmbed] });

      // Mesajı güncelle - fotoğrafı koruyalım
      const updatedEmbed = new EmbedBuilder()
        .setTitle('❌ Reddedildi!')
        .setDescription(`**Reddeden:** ${moderator.tag}\n\n**Sebep:**\n${reason}`)
        .setImage(imageUrl)
        .setColor('#ef4444')
        .setTimestamp();

      await interaction.update({ 
        embeds: [updatedEmbed], 
        components: [] 
      });

      // Orijinal mesajı sil
      try {
        if (photoData?.originalMessage) {
          await photoData.originalMessage.delete();
        }
      } catch (err) {
        console.log('Orijinal mesaj silinemedi:', err);
      }

      // Fotoğrafı Map'ten temizle
      pendingPhotos.delete(interaction.message.id);
    }
  }
});

client.on('ready', async () => {
  console.log(`Bot ${client.user.tag} olarak giriş yaptı!`);
  
  // İstatistikleri yükle
  loadStats();

  // Slash komutları kaydet
  const commands = [
    new SlashCommandBuilder()
      .setName('stats')
      .setDescription('Yetkili istatistiklerini gösterir')
  ];

  try {
    await client.application.commands.set(commands);
    console.log('Slash komutları kaydedildi!');
  } catch (err) {
    console.log('Komut kaydetme hatası:', err);
  }
});

client.once("ready", () => {
  console.log(`${client.user.tag} aktif`);

  const guild = client.guilds.cache.get(config.sunucuid);
  if (!guild) return console.log("Sunucu bulunamadı");

  const channel = guild.channels.cache.get(config.sesid);
  if (!channel || channel.type !== ChannelType.GuildVoice) {
    return console.log("Geçerli bir ses kanalı değil");
  }

  joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true,
    selfMute: false,
    debug: false
  });

  console.log("Bot ses kanalına otomatik bağlandı");
});


client.login(config.token);