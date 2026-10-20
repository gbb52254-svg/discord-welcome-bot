
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const DATA_FILE =
  process.env.CONFIG_PATH || '/data/ticket-config.json';

let cache = null;
let saveQueue = Promise.resolve();

async function load() {
  if (cache !== null) return cache;

  try {
    const content = await readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(content);

    cache = parsed && typeof parsed === 'object'
      ? parsed
      : { guilds: {} };
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(
        '[CriPss Family] Could not load data:',
        error.message
      );
    }

    cache = { guilds: {} };
  }

  if (!cache.guilds || typeof cache.guilds !== 'object') {
    cache.guilds = {};
  }

  return cache;
}

export async function save() {
  const data = await load();

  // Serialize writes to prevent overlapping saves.
  saveQueue = saveQueue.then(async () => {
    await mkdir(dirname(DATA_FILE), { recursive: true });

    const tempFile = `${DATA_FILE}.tmp`;

    await writeFile(
      tempFile,
      JSON.stringify(data, null, 2),
      'utf8'
    );

    const { rename } = await import('node:fs/promises');
    await rename(tempFile, DATA_FILE);
  });

  try {
    await saveQueue;
  } catch (error) {
    console.error(
      '[CriPss Family] Could not save data:',
      error.message
    );
    throw error;
  }
}

function createGuildSettings() {
  return {
    // Ticket system
    categoryId:
      (process.env.TICKET_CATEGORY_ID || '').trim() || null,

    logChannelId:
      (process.env.LOG_CHANNEL_ID || '').trim() || null,

    supportRoleId:
      (process.env.SUPPORT_ROLE_ID || '').trim() || null,

    welcome:
      (process.env.TICKET_MESSAGE || '').trim() ||
      'Welcome to your CriPss Family ticket! Describe your request below.',

    counter: 0,
    open: {},
    ticketPanels: {},

    // Application system
    apply: {
      enabled: false,
      panelChannelId: null,
      logChannelId: null,
      categoryId: null,
      staffRoleId: null,
      title: 'CriPss Family | Apply',
      description: 'Apply to join CriPss Family.',
      image: null,
      color: '#1677FF',
      questions: [],
      pending: {},
    },

    // Welcome system
    welcomeSystem: {
      enabled: false,
      channelId: null,
      title: 'Welcome to CriPss Family',
      message: 'Welcome {user} to CriPss Family!',
      image: null,
      color: '#1677FF',
    },

    // Leave system
    leaveSystem: {
      enabled: false,
      channelId: null,
      title: 'Member Left',
      message: '{username} has left CriPss Family.',
      image: null,
      color: '#1677FF',
    },

    // Automatic response when the bot is mentioned
    autoTag: {
      enabled: false,
      message: 'Hey! Thanks for mentioning CriPss Family Bot.',
      image: null,
      cooldownSeconds: 5,
    },

    // Voice channel configuration
    voice: {
      enabled: true,
      lastChannelId: null,
    },

    // Moderation settings
    moderation: {
      logChannelId: null,
      mutedRoleId: null,
    },

    // Voting configuration
    votes: {},

    // Bot branding
    branding: {
      name: 'CriPss Family',
      developer: 'Crips Ftw',
      color: '#1677FF',
    },
  };
}

export async function getGuild(guildId) {
  if (!guildId) {
    throw new Error('A valid guild ID is required.');
  }

  const data = await load();

  if (!data.guilds[guildId]) {
    data.guilds[guildId] = createGuildSettings();
    await save();
    return data.guilds[guildId];
  }

  const settings = data.guilds[guildId];
  const defaults = createGuildSettings();

  // Preserve existing settings while adding new sections.
  for (const [key, value] of Object.entries(defaults)) {
    if (settings[key] === undefined || settings[key] === null) {
      settings[key] = value;
    } else if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      settings[key] = {
        ...value,
        ...settings[key],
      };
    }
  }

  return settings;
}
