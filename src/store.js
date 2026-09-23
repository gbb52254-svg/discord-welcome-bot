import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

// Per-guild settings persist to the FadeHost bot's /data volume, which
// survives restarts and redeploys. Env vars are the defaults; a slash
// command's setting wins once it is made.
const DATA_FILE = process.env.CONFIG_PATH || '/data/welcome-config.json';

let cache = null;

async function load() {
  if (cache) return cache;
  try {
    cache = JSON.parse(await readFile(DATA_FILE, 'utf8'));
  } catch {
    cache = { guilds: {} };
  }
  return cache;
}

export async function save() {
  try {
    await mkdir(dirname(DATA_FILE), { recursive: true });
    await writeFile(DATA_FILE, JSON.stringify(cache, null, 2));
  } catch (err) {
    console.error('[welcome-bot] could not save config:', err.message);
  }
}

export async function getGuild(guildId) {
  const data = await load();
  if (!data.guilds[guildId]) {
    data.guilds[guildId] = {
      welcomeChannelId: (process.env.WELCOME_CHANNEL_ID || '').trim() || null,
      welcomeMessage: (process.env.WELCOME_MESSAGE || '').trim() || 'Welcome {user} to **{server}**! You are member number {count}.',
      goodbyeChannelId: (process.env.GOODBYE_CHANNEL_ID || '').trim() || null,
      goodbyeMessage: (process.env.GOODBYE_MESSAGE || '').trim() || '{username} left the server.',
      roleId: (process.env.AUTO_ROLE_ID || '').trim() || null,
      dm: false,
    };
    await save();
  }
  return data.guilds[guildId];
}
