const { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, REST, Routes, SlashCommandBuilder } = require('discord.js');
const http = require('http');

// Lightweight HTTP server for Cloud Hosting platforms (Render / Koyeb / Railway)
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('A.E.G.I.S. Mainframe Core: ONLINE 24/7\n');
}).listen(PORT, () => {
  console.log(`[A.E.G.I.S. Web Keep-Alive] Listening on port ${PORT}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

const TOKEN = process.env.DISCORD_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const GUILD_ID = '1540310872520396800';

function isStaffMember(member, guild) {
  if (!member) return false;
  if (member.id === guild.ownerId) return true;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  if (member.permissions.has(PermissionFlagsBits.ManageChannels)) return true;
  if (member.permissions.has(PermissionFlagsBits.ManageMessages)) return true;
  return member.roles.cache.some(r => r.name.includes('Aegis Director') || r.name.includes('Bunker Warden'));
}

client.once('ready', async () => {
  console.log(`[A.E.G.I.S. Mainframe] Online as ${client.user.tag}!`);
  
  const guild = await client.guilds.fetch(GUILD_ID);
  if (!guild) {
    console.error('Guild not found!');
    process.exit(1);
  }
  
  // Set nickname
  try {
    if (guild.members.me) {
      await guild.members.me.setNickname('A.E.G.I.S.');
      console.log('Server nickname verified: A.E.G.I.S.');
    }
  } catch (e) {}

  // Register Slash Commands automatically
  try {
    const commands = [
      new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Cleans and purges messages in the current channel (Staff Only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addIntegerOption(opt =>
          opt.setName('amount')
            .setDescription('Number of messages to delete (1 - 100)')
            .setMinValue(1)
            .setMaxValue(100)
            .setRequired(false)
        ),
      new SlashCommandBuilder()
        .setName('status')
        .setDescription('Displays Sector-4 Bunker Telemetry, Power Grid & Spore Gauge'),
      new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays the A.E.G.I.S. Mainframe commands and guide')
    ].map(cmd => cmd.toJSON());

    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationGuildCommands(client.user.id, GUILD_ID), { body: commands });
    console.log('Guild slash commands registered successfully.');
  } catch (err) {
    console.error('Error auto-registering slash commands:', err.message);
  }

  // 1. Roles Definition
  const rolesNeeded = [
    { name: '[👑] Aegis Director', color: '#FF0000', hoist: true, permissions: [PermissionFlagsBits.Administrator] },
    { name: '[🛡️] Bunker Warden', color: '#00FF00', hoist: true, permissions: [PermissionFlagsBits.KickMembers, PermissionFlagsBits.BanMembers, PermissionFlagsBits.ManageMessages] },
    { name: '[🧬] Bio-Architect', color: '#00FFFF', hoist: true },
    { name: '[🛠️] Co-Developer', color: '#3498DB', hoist: true },
    { name: '[🤖] Bots', color: '#546E7A', hoist: true },
    { name: '[🧪] Radiant Zéro', color: '#9B59B6', hoist: true },
    { name: '[⭐] VIP', color: '#F1C40F', hoist: true },
    // 9 Classes
    { name: '[⚔️] Assault Soldier', color: '#2ECC71', hoist: false },
    { name: '[💥] Demolition Miner', color: '#E67E22', hoist: false },
    { name: '[💉] Combat Medic', color: '#00E5FF', hoist: false },
    { name: '[🛡️] Defense Engineer', color: '#F1C40F', hoist: false },
    { name: '[🎯] Recon Marksman', color: '#27AE60', hoist: false },
    { name: '[🔨] Tactical Armorer', color: '#9B59B6', hoist: false },
    { name: '[💣] Heavy Commando', color: '#E74C3C', hoist: false },
    { name: '[🧪] Chemical Virologist', color: '#1ABC9C', hoist: false },
    { name: '[🔮] Radiant Symbiote', color: '#9B59B6', hoist: false },
    // Languages
    { name: '[🇬🇧] English', color: '#3498DB', hoist: false },
    { name: '[🇫🇷] Français', color: '#3498DB', hoist: false },
    { name: '[🇩🇪] Deutsch', color: '#E67E22', hoist: false },
    { name: '[🇷🇺] Русский', color: '#E74C3C', hoist: false },
    { name: '[🇵🇱] Polski', color: '#E91E63', hoist: false },
    { name: '[🇪🇸] Español', color: '#F39C12', hoist: false },
    { name: '[🇧🇷] Português', color: '#2ECC71', hoist: false },
    // Base & Mute
    { name: '[☣️] Survivor', color: '#95A5A6', hoist: true },
    { name: '[⛓️] Prisoner', color: '#2C3E50', hoist: true }
  ];

  const roleMap = {};
  const guildRoles = await guild.roles.fetch();

  for (const r of rolesNeeded) {
    let role = guildRoles.find(gr => gr.name === r.name);
    if (!role) {
      try {
        role = await guild.roles.create({
          name: r.name,
          color: r.color,
          hoist: r.hoist,
          permissions: r.permissions || [],
          reason: 'BIO-OUTBREAK setup'
        });
      } catch (err) {}
    }
    if (role) {
      roleMap[r.name] = role;
    }
  }

  const botRole = roleMap['[🤖] Bots'];
  if (botRole) {
    try {
      guild.members.cache.forEach(async member => {
        if (member.user.bot && !member.roles.cache.has(botRole.id)) {
          await member.roles.add(botRole).catch(() => {});
        }
      });
    } catch (err) {}
  }

  console.log('[A.E.G.I.S. Mainframe] System fully operational.');
});

// Handle All Interactions (Slash Commands, Modals, Buttons)
client.on('interactionCreate', async interaction => {
  const guild = interaction.guild;
  const user = interaction.user;

  // 1. Slash Commands Handling (/clear, /status, /help)
  if (interaction.isChatInputCommand()) {
    const member = await guild.members.fetch(user.id);
    const { commandName } = interaction;

    if (commandName === 'clear') {
      if (!isStaffMember(member, guild)) {
        return interaction.reply({ content: '❌ Access Denied: Only Bunker Wardens and Aegis Directors can use /clear.', ephemeral: true });
      }

      const amount = interaction.options.getInteger('amount') || 100;
      try {
        const deleted = await interaction.channel.bulkDelete(amount, true);
        return interaction.reply({ content: `🧹 Successfully purged **${deleted.size}** messages from this channel.`, ephemeral: true });
      } catch (err) {
        return interaction.reply({ content: `Failed to clear messages: ${err.message}`, ephemeral: true });
      }
    }

    if (commandName === 'status') {
      return interaction.reply({
        content: `\`\`\`prolog
================================================================================
           A.E.G.I.S. SECTOR-4 MAINFRAME TELEMETRY REPORT
================================================================================
[STATUS]                : ACTIVE (DEFENSES ONLINE)
[POWER GRID]            : 87.4% (GENERATOR STABLE)
[BIO-CANNON]            : 32.0% CHARGED (GPS MODULE REQUIRED)
[SPORE GAUGE]           : TIER II (+20% HORDE HP/DMG)
[ATMOSPHERE]            : GREEN ZONE (0% TOX) | YELLOW ZONE (MODERATE) | RED ZONE (LETHAL)
[QUARANTINE CELL]       : 0 CONTAINED
[PATIENT-ZERO SIGNAL]   : DETECTED (DIRECTOR 4GKP / CONSCIOUSNESS STABLE)
================================================================================
\`\`\``,
        ephemeral: true
      });
    }

    if (commandName === 'help') {
      return interaction.reply({
        content: `# 🖥️ A.E.G.I.S. Mainframe Commands\n- \`/clear [amount]\` : Purge messages in current channel (Staff Only)\n- \`/status\` : View live Sector-4 bunker telemetry\n- \`/help\` : View this command guide`,
        ephemeral: true
      });
    }
  }

  // 2. Modal Submission Handling (Close Ticket with Name & Reason)
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'modal_close_ticket') {
      const userName = interaction.fields.getTextInputValue('ticket_user_name') || 'Unknown';
      const reason = interaction.fields.getTextInputValue('close_reason') || 'No reason specified';
      const channel = interaction.channel;
      const closedBy = interaction.user;

      const logsChannel = guild.channels.cache.find(c => c.name.includes('ticket-logs'));
      if (logsChannel) {
        const logEmbed = new EmbedBuilder()
          .setTitle('🔒 Ticket Closed & Archived')
          .setColor('#E74C3C')
          .addFields(
            { name: '🎫 Ticket Channel', value: `\`#${channel.name}\``, inline: true },
            { name: '👤 User / Player Name', value: `\`${userName}\``, inline: true },
            { name: '🛡️ Closed By', value: `<@${closedBy.id}> (${closedBy.tag})`, inline: true },
            { name: '📝 Reason for Closure', value: `\`\`\`${reason}\`\`\``, inline: false }
          )
          .setTimestamp()
          .setFooter({ text: 'A.E.G.I.S. Secure Staff Audit' });

        await logsChannel.send({ embeds: [logEmbed] }).catch(() => {});
      }

      await interaction.reply({ 
        content: `🔒 **Ticket Closed.**\n👤 **User:** \`${userName}\`\n📝 **Reason:** *"${reason}"*\n\n*Closing and deleting channel in 5 seconds...*` 
      });

      setTimeout(async () => {
        try {
          await channel.delete();
        } catch (err) {}
      }, 5000);
      return;
    }
  }

  // 3. Button Interactions Handling
  if (!interaction.isButton()) return;

  const member = await guild.members.fetch(user.id);

  // A. Rules Verification Button
  if (interaction.customId === 'verify_rules') {
    const survivorRole = guild.roles.cache.find(r => r.name.includes('Survivor'));
    const classChannel = guild.channels.cache.find(c => c.name.includes('class-selection'));
    const langChannel = guild.channels.cache.find(c => c.name.includes('language-selection'));
    
    const classLink = classChannel ? `<#${classChannel.id}>` : '#class-selection';
    const langLink = langChannel ? `<#${langChannel.id}>` : '#language-selection';
    
    if (survivorRole) {
      if (member.roles.cache.has(survivorRole.id)) {
        return interaction.reply({ 
          content: `✅ You are already verified as a Survivor!\n\n👉 Proceed to ${classLink} to choose your combat classes and ${langLink} to unlock your language lounge!`, 
          ephemeral: true 
        });
      }
      try {
        await member.roles.add(survivorRole);
        return interaction.reply({ 
          content: `✅ **Protocol Verified / Access Granted!**\nWelcome to Sector-4, Survivor. You have unlocked full access to the Bunker!\n\n👉 **Next Steps:**\n1. Head over to ${classLink} to choose your in-game combat classes.\n2. Head over to ${langLink} to unlock your localized language lounge!`, 
          ephemeral: true 
        });
      } catch (err) {
        return interaction.reply({ content: 'Failed to assign Survivor role. Please ask an admin.', ephemeral: true });
      }
    }
    return interaction.reply({ content: 'Survivor role not found.', ephemeral: true });
  }

  // B. Terminal Status / Alarm Buttons
  if (interaction.customId === 'btn_status') {
    return interaction.reply({
      content: `\`\`\`prolog
================================================================================
           A.E.G.I.S. SECTOR-4 MAINFRAME TELEMETRY REPORT
================================================================================
[STATUS]                : ACTIVE (DEFENSES ONLINE)
[POWER GRID]            : 87.4% (GENERATOR STABLE)
[BIO-CANNON]            : 32.0% CHARGED (GPS MODULE REQUIRED)
[SPORE GAUGE]           : TIER II (+20% HORDE HP/DMG)
[ATMOSPHERE]            : GREEN ZONE (0% TOX) | YELLOW ZONE (MODERATE) | RED ZONE (LETHAL)
[QUARANTINE CELL]       : 0 CONTAINED
[PATIENT-ZERO SIGNAL]   : DETECTED (DIRECTOR 4GKP / CONSCIOUSNESS STABLE)
================================================================================
\`\`\``,
      ephemeral: true
    });
  }

  if (interaction.customId === 'btn_alarm_yellow') {
    const general = guild.channels.cache.find(c => c.name.includes('general-chat'));
    if (general) {
      await general.send(`⚠️ **[A.E.G.I.S. ALARM - LEVEL YELLOW]**: Spore Storm detected in surface ruins. All units in Yellow Zone are advised to fall back to the Bunker!`);
    }
    return interaction.reply({ content: 'Broadcasted Yellow Alarm.', ephemeral: true });
  }

  if (interaction.customId === 'btn_alarm_red') {
    const general = guild.channels.cache.find(c => c.name.includes('general-chat'));
    if (general) {
      await general.send(`🚨 **[A.E.G.I.S. EMERGENCY - CODE RED]**: BREACH DETECTED IN BUNKER WALLS! Heavy mutant vanguard approaching Sector-4! All Commandos, Soldiers, and Engineers to defensive stations!`);
    }
    return interaction.reply({ content: 'Broadcasted Code Red Alert.', ephemeral: true });
  }

  // C. Class Selection Buttons (9 Classes)
  if (interaction.customId.startsWith('role_')) {
    const classNameMap = {
      'role_assault_soldier': '[⚔️] Assault Soldier',
      'role_demolition_miner': '[💥] Demolition Miner',
      'role_combat_medic': '[💉] Combat Medic',
      'role_defense_engineer': '[🛡️] Defense Engineer',
      'role_recon_marksman': '[🎯] Recon Marksman',
      'role_tactical_armorer': '[🔨] Tactical Armorer',
      'role_heavy_commando': '[💣] Heavy Commando',
      'role_chemical_virologist': '[🧪] Chemical Virologist',
      'role_radiant_symbiote': '[🔮] Radiant Symbiote',
      // Legacy
      'role_commando': '[⚔️] Assault Soldier',
      'role_virologist': '[🧪] Chemical Virologist',
      'role_engineer': '[🛡️] Defense Engineer',
      'role_miner': '[💥] Demolition Miner'
    };

    const targetRoleName = classNameMap[interaction.customId];
    const role = guild.roles.cache.find(r => r.name === targetRoleName);

    if (!role) return interaction.reply({ content: 'Role not found.', ephemeral: true });

    try {
      if (member.roles.cache.has(role.id)) {
        await member.roles.remove(role);
        return interaction.reply({ content: `Removed the **${targetRoleName}** class!`, ephemeral: true });
      } else {
        await member.roles.add(role);
        return interaction.reply({ content: `Equipped the **${targetRoleName}** class!`, ephemeral: true });
      }
    } catch (err) {
      return interaction.reply({ content: 'Failed to update roles.', ephemeral: true });
    }
  }

  // D. Language Selection Buttons (7 Languages)
  if (interaction.customId.startsWith('lang_')) {
    const langMap = {
      'lang_en': '[🇬🇧] English',
      'lang_fr': '[🇫🇷] Français',
      'lang_de': '[🇩🇪] Deutsch',
      'lang_ru': '[🇷🇺] Русский',
      'lang_pl': '[🇵🇱] Polski',
      'lang_es': '[🇪🇸] Español',
      'lang_pt': '[🇧🇷] Português'
    };

    const targetRoleName = langMap[interaction.customId];
    const role = guild.roles.cache.find(r => r.name === targetRoleName);

    if (!role) return interaction.reply({ content: 'Language role not found.', ephemeral: true });

    try {
      if (member.roles.cache.has(role.id)) {
        await member.roles.remove(role);
        return interaction.reply({ content: `Removed **${targetRoleName}** channel access.`, ephemeral: true });
      } else {
        await member.roles.add(role);
        return interaction.reply({ content: `Unlocked **${targetRoleName}** channel in **🌐 INTERNATIONAL SECTORS**!`, ephemeral: true });
      }
    } catch (err) {
      return interaction.reply({ content: 'Failed to update language role.', ephemeral: true });
    }
  }

  // E. Ticket Creation Button (Anti-Duplication)
  if (interaction.customId === 'create_ticket') {
    const ticketChannelName = `ticket-${user.username.toLowerCase()}`;
    const existingChannel = guild.channels.cache.find(c => c.name.toLowerCase() === ticketChannelName.toLowerCase());
    if (existingChannel) {
      return interaction.reply({ content: `You already have an active support ticket: <#${existingChannel.id}>`, ephemeral: true });
    }

    let ticketCategory = guild.channels.cache.find(c => c.name.includes('ACTIVE TICKETS') && c.type === ChannelType.GuildCategory);
    if (!ticketCategory) {
      try {
        ticketCategory = await guild.channels.create({
          name: '🎫 ACTIVE TICKETS',
          type: ChannelType.GuildCategory
        });
      } catch (err) {
        return interaction.reply({ content: 'Failed to create ticket category.', ephemeral: true });
      }
    }
    
    const adminRole = guild.roles.cache.find(r => r.name.includes('Aegis Director'));
    const wardenRole = guild.roles.cache.find(r => r.name.includes('Bunker Warden'));

    try {
      const channel = await guild.channels.create({
        name: ticketChannelName,
        type: ChannelType.GuildText,
        parent: ticketCategory.id,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          },
          ...(adminRole ? [{
            id: adminRole.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          }] : []),
          ...(wardenRole ? [{
            id: wardenRole.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          }] : [])
        ]
      });
      
      const claimButton = new ButtonBuilder()
        .setCustomId('claim_ticket')
        .setLabel('Claim Ticket')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🙋');

      const closeButton = new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒');

      const row = new ActionRowBuilder().addComponents(claimButton, closeButton);

      const pings = [];
      if (adminRole) pings.push(`<@&${adminRole.id}>`);
      if (wardenRole) pings.push(`<@&${wardenRole.id}>`);
      const pingText = pings.join(' ');

      await channel.send({
        content: `Welcome <@${user.id}>!\nThank you for reaching out to Aegis Support. The Warden staff has been notified: ${pingText}\n\nPlease describe your issue here in detail. Staff will assist you shortly.`,
        components: [row]
      });
      
      const logsChannel = guild.channels.cache.find(c => c.name.includes('ticket-logs'));
      if (logsChannel) {
        await logsChannel.send(`🎫 **Ticket Created**: <#${channel.id}> by <@${user.id}> (${user.tag})`);
      }
      
      await interaction.reply({ content: `Your support ticket has been created: <#${channel.id}>`, ephemeral: true });
    } catch (err) {
      await interaction.reply({ content: 'An error occurred while creating your ticket.', ephemeral: true });
    }
  }
  
  // F. Ticket Claim Button (Staff Only)
  if (interaction.customId === 'claim_ticket') {
    if (!isStaffMember(member, guild)) {
      return interaction.reply({ content: '❌ Access Denied: Only Bunker Wardens and Aegis Directors can claim tickets!', ephemeral: true });
    }

    const disabledClaimButton = new ButtonBuilder()
      .setCustomId('claim_ticket')
      .setLabel(`Claimed by ${user.username}`)
      .setStyle(ButtonStyle.Success)
      .setEmoji('🙋')
      .setDisabled(true);

    const closeButton = new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🔒');

    const updatedRow = new ActionRowBuilder().addComponents(disabledClaimButton, closeButton);

    try {
      await interaction.update({
        components: [updatedRow]
      });
      
      await interaction.channel.send(`🙋 <@${user.id}> has claimed this ticket and will be assisting you!`);
      
      const logsChannel = guild.channels.cache.find(c => c.name.includes('ticket-logs'));
      if (logsChannel) {
        await logsChannel.send(`🙋 **Ticket Claimed**: \`#${interaction.channel.name}\` claimed by <@${user.id}> (${user.tag})`);
      }
    } catch (err) {}
  }

  // G. Ticket Close Button (Staff Only - Opens Modal)
  if (interaction.customId === 'close_ticket') {
    if (!isStaffMember(member, guild)) {
      return interaction.reply({ content: '❌ Access Denied: Only Bunker Wardens and Aegis Directors can close tickets!', ephemeral: true });
    }

    const modal = new ModalBuilder()
      .setCustomId('modal_close_ticket')
      .setTitle('Close Support Ticket');

    const nameInput = new TextInputBuilder()
      .setCustomId('ticket_user_name')
      .setLabel('Name :')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Player username or ticket reference')
      .setValue(interaction.channel.name.replace('ticket-', ''))
      .setRequired(true);

    const reasonInput = new TextInputBuilder()
      .setCustomId('close_reason')
      .setLabel('Reason :')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Describe the resolution or why this ticket is being closed...')
      .setRequired(true)
      .setMinLength(3)
      .setMaxLength(500);

    const row1 = new ActionRowBuilder().addComponents(nameInput);
    const row2 = new ActionRowBuilder().addComponents(reasonInput);
    modal.addComponents(row1, row2);

    return interaction.showModal(modal);
  }
});

// Global crash prevention & 24/7 Keep-Alive
process.on('unhandledRejection', (reason, promise) => {
  console.error('[A.E.G.I.S. Keep-Alive] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[A.E.G.I.S. Keep-Alive] Uncaught Exception:', err);
});

function startBot() {
  client.login(TOKEN).catch(err => {
    console.error('[A.E.G.I.S. Keep-Alive] Login error, retrying in 5 seconds...', err.message);
    setTimeout(startBot, 5000);
  });
}

startBot();
