import { ChannelType, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { getGuild, save } from './store.js';

export const commands = [
  new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Welcome messages and the automatic role')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) => s.setName('channel').setDescription('Where welcome messages go').addChannelOption((o) => o.setName('channel').setDescription('The channel').addChannelTypes(ChannelType.GuildText).setRequired(true)))
    .addSubcommand((s) => s.setName('message').setDescription('The welcome text: {user} mentions, {username}, {server}, {count} fill themselves in').addStringOption((o) => o.setName('text').setDescription('The message').setRequired(true).setMaxLength(1500)))
    .addSubcommand((s) => s.setName('role').setDescription('A role every new member gets').addRoleOption((o) => o.setName('role').setDescription('The role, or leave it out to stop giving one')))
    .addSubcommand((s) => s.setName('dm').setDescription('Also send the welcome as a direct message').addBooleanOption((o) => o.setName('on').setDescription('On or off').setRequired(true)))
    .addSubcommand((s) => s.setName('test').setDescription('Send the welcome message for yourself, to check it'))
    .addSubcommand((s) => s.setName('status').setDescription('What is set up')),
  new SlashCommandBuilder()
    .setName('goodbye')
    .setDescription('Goodbye messages')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((s) => s.setName('channel').setDescription('Where goodbye messages go').addChannelOption((o) => o.setName('channel').setDescription('The channel, or leave it out to stop them').addChannelTypes(ChannelType.GuildText)))
    .addSubcommand((s) => s.setName('message').setDescription('The goodbye text: {username}, {server}, {count} fill themselves in').addStringOption((o) => o.setName('text').setDescription('The message').setRequired(true).setMaxLength(1500))),
].map((c) => c.toJSON());

export function fill(text, member) {
  return text
    .replaceAll('{user}', `<@${member.id}>`)
    .replaceAll('{username}', member.user?.username ?? member.displayName ?? 'someone')
    .replaceAll('{server}', member.guild.name)
    .replaceAll('{count}', String(member.guild.memberCount));
}

export function welcomeEmbed(text, member) {
  return new EmbedBuilder()
    .setDescription(fill(text, member))
    .setColor(0x57f287)
    .setThumbnail(member.user?.displayAvatarURL?.({ size: 128 }) ?? null)
    .setTimestamp();
}

export async function handleCommand(interaction) {
  const settings = await getGuild(interaction.guildId);
  const sub = interaction.options.getSubcommand();

  if (interaction.commandName === 'welcome') {
    if (sub === 'channel') {
      settings.welcomeChannelId = interaction.options.getChannel('channel').id;
      await save();
      await interaction.reply({ content: `Welcome messages go to <#${settings.welcomeChannelId}>.`, ephemeral: true });
    } else if (sub === 'message') {
      settings.welcomeMessage = interaction.options.getString('text');
      await save();
      await interaction.reply({ content: 'Welcome message saved. Try /welcome test.', ephemeral: true });
    } else if (sub === 'role') {
      const role = interaction.options.getRole('role');
      settings.roleId = role ? role.id : null;
      await save();
      await interaction.reply({ content: role ? `New members get <@&${role.id}>. The bot's own role has to sit above it.` : 'New members get no role.', ephemeral: true });
    } else if (sub === 'dm') {
      settings.dm = interaction.options.getBoolean('on');
      await save();
      await interaction.reply({ content: settings.dm ? 'New members also get the welcome as a direct message.' : 'No direct messages.', ephemeral: true });
    } else if (sub === 'test') {
      await interaction.reply({ embeds: [welcomeEmbed(settings.welcomeMessage, interaction.member)], ephemeral: true });
    } else if (sub === 'status') {
      await interaction.reply({
        content: [
          `Welcome channel: ${settings.welcomeChannelId ? `<#${settings.welcomeChannelId}>` : 'not set'}`,
          `Role: ${settings.roleId ? `<@&${settings.roleId}>` : 'none'}`,
          `Direct message: ${settings.dm ? 'on' : 'off'}`,
          `Goodbye channel: ${settings.goodbyeChannelId ? `<#${settings.goodbyeChannelId}>` : 'not set'}`,
        ].join('\n'),
        ephemeral: true,
      });
    }
    return;
  }

  if (interaction.commandName === 'goodbye') {
    if (sub === 'channel') {
      const channel = interaction.options.getChannel('channel');
      settings.goodbyeChannelId = channel ? channel.id : null;
      await save();
      await interaction.reply({ content: channel ? `Goodbye messages go to <#${channel.id}>.` : 'Goodbye messages are off.', ephemeral: true });
    } else if (sub === 'message') {
      settings.goodbyeMessage = interaction.options.getString('text');
      await save();
      await interaction.reply({ content: 'Goodbye message saved.', ephemeral: true });
    }
  }
}

export function registerEvents(client, Events) {
  client.on(Events.GuildMemberAdd, async (member) => {
    const settings = await getGuild(member.guild.id);
    if (settings.roleId) {
      await member.roles.add(settings.roleId).catch((err) => console.error('[welcome-bot] role not given:', err.message));
    }
    if (settings.welcomeChannelId) {
      const channel = member.guild.channels.cache.get(settings.welcomeChannelId);
      if (channel) await channel.send({ embeds: [welcomeEmbed(settings.welcomeMessage, member)] }).catch((err) => console.error('[welcome-bot] welcome not sent:', err.message));
    }
    if (settings.dm) {
      await member.send({ embeds: [welcomeEmbed(settings.welcomeMessage, member)] }).catch(() => {});
    }
  });

  client.on(Events.GuildMemberRemove, async (member) => {
    const settings = await getGuild(member.guild.id);
    if (!settings.goodbyeChannelId) return;
    const channel = member.guild.channels.cache.get(settings.goodbyeChannelId);
    if (channel) await channel.send({ content: fill(settings.goodbyeMessage, member) }).catch((err) => console.error('[welcome-bot] goodbye not sent:', err.message));
  });
}
