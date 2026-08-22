const { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

const TOKEN = process.env.DISCORD_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const GUILD_ID = '1540310872520396800';

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
  } catch (e) {
    // Ignore
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
    // Classes
    { name: '[🔫] Commando', color: '#E67E22', hoist: false },
    { name: '[💉] Virologist', color: '#1ABC9C', hoist: false },
    { name: '[⚙️] Engineer', color: '#F1C40F', hoist: false },
    { name: '[⛏️] Miner', color: '#34495E', hoist: false },
    // Languages
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
      } catch (err) {
        // ignore
      }
    }
    if (role) {
      roleMap[r.name] = role;
    }
  }

  const botRole = roleMap['[🤖] Bots'];
  const prisonerRole = roleMap['[⛓️] Prisoner'];

  // Auto assign bot role to bots
  if (botRole) {
    try {
      guild.members.cache.forEach(async member => {
        if (member.user.bot && !member.roles.cache.has(botRole.id)) {
          await member.roles.add(botRole).catch(() => {});
        }
      });
    } catch (err) {
      // ignore
    }
  }

  // Ensure Prisoner overrides
  if (prisonerRole) {
    const channels = await guild.channels.fetch();
    for (const [id, ch] of channels) {
      if (ch.type === ChannelType.GuildText || ch.type === ChannelType.GuildVoice || ch.type === ChannelType.GuildForum) {
        if (ch.parent && (ch.parent.name === '🔒 WARDENS HEADQUARTERS' || ch.parent.name === '🤫 ARCHITECTS BUNKER')) continue;
        try {
          await ch.permissionOverwrites.edit(prisonerRole.id, {
            SendMessages: false,
            SendMessagesInThreads: false,
            AddReactions: false,
            CreatePublicThreads: false,
            CreatePrivateThreads: false,
            Connect: false
          });
        } catch (err) {}
      }
    }
  }

  // Post Terminal Hub in #bot-commands
  const staffCategory = guild.channels.cache.find(c => c.name === '🔒 WARDENS HEADQUARTERS' && c.type === ChannelType.GuildCategory);
  if (staffCategory) {
    const cmdChannel = guild.channels.cache.find(c => c.name === 'bot-commands' && c.parentId === staffCategory.id);
    if (cmdChannel) {
      const msgs = await cmdChannel.messages.fetch({ limit: 5 });
      if (msgs.size === 0) {
        const terminalRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('btn_status').setLabel('Sector-4 Status').setStyle(ButtonStyle.Primary).setEmoji('📊'),
          new ButtonBuilder().setCustomId('btn_alarm_yellow').setLabel('Alarm: Yellow').setStyle(ButtonStyle.Secondary).setEmoji('⚠️'),
          new ButtonBuilder().setCustomId('btn_alarm_red').setLabel('Alarm: Red Alert').setStyle(ButtonStyle.Danger).setEmoji('🚨')
        );

        await cmdChannel.send({
          content: `# 🖥️ A.E.G.I.S. TERMINAL COMMAND CONSOLE\nUse the buttons below to trigger automated bunker broadcasts or view real-time telemetry from Sector-4:`,
          components: [terminalRow]
        });
      }
    }
  }

  console.log('[A.E.G.I.S. Mainframe] System fully operational.');
});

// Handle Interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const guild = interaction.guild;
  const user = interaction.user;
  const member = await guild.members.fetch(user.id);

  // 0. Rules Verification Button
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
          content: `✅ **Protocole Validé / Verification Complete!**\nBienvenue dans le Secteur-4, Survivant. Vous avez débloqué l'accès au Bunker !\n\n👉 **Étapes suivantes :**\n1. Rendez-vous dans ${classLink} pour choisir vos classes de combat.\n2. Rendez-vous dans ${langLink} pour débloquer votre salon de discussion par langue !`, 
          ephemeral: true 
        });
      } catch (err) {
        return interaction.reply({ content: 'Failed to assign Survivor role. Please ask an admin.', ephemeral: true });
      }
    }
    return interaction.reply({ content: 'Survivor role not found.', ephemeral: true });
  }

  // 1. Terminal Buttons
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

  // 2. Class Selection Buttons (9 In-Game Classes)
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
      // Legacy fallbacks
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

  // 3. Language Selection Buttons
  if (interaction.customId.startsWith('lang_')) {
    const langMap = {
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

  // Staff roles for tickets
  const adminRole = guild.roles.cache.find(r => r.name.includes('Aegis Director'));
  const wardenRole = guild.roles.cache.find(r => r.name.includes('Bunker Warden'));

  // 4. Ticket Creation Button
  if (interaction.customId === 'create_ticket') {
    let ticketCategory = guild.channels.cache.find(c => c.name === '🎫 ACTIVE TICKETS' && c.type === ChannelType.GuildCategory);
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
    
    const ticketChannelName = `ticket-${user.username.toLowerCase()}`;
    const existingChannel = guild.channels.cache.find(c => c.name === ticketChannelName && c.parentId === ticketCategory.id);
    if (existingChannel) {
      return interaction.reply({ content: `You already have an open ticket: <#${existingChannel.id}>`, ephemeral: true });
    }
    
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
          {
            id: adminRole.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          },
          {
            id: wardenRole.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          }
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
  
  // 5. Ticket Claim Button
  if (interaction.customId === 'claim_ticket') {
    const hasStaffRole = member.roles.cache.some(r => r.name.includes('Aegis Director') || r.name.includes('Bunker Warden'));
    if (!hasStaffRole) {
      return interaction.reply({ content: '❌ Only Warden staff can claim tickets!', ephemeral: true });
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

  // 6. Ticket Close Button
  if (interaction.customId === 'close_ticket') {
    const channel = interaction.channel;
    
    const logsChannel = guild.channels.cache.find(c => c.name.includes('ticket-logs'));
    if (logsChannel) {
      await logsChannel.send(`🔒 **Ticket Closed**: \`#${channel.name}\` closed by <@${user.id}> (${user.tag})`);
    }
    
    await interaction.reply({ content: 'Closing ticket in 5 seconds...' });
    
    setTimeout(async () => {
      try {
        await channel.delete();
      } catch (err) {}
    }, 5000);
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
