# FadeHost Welcome Bot

Welcomes new members with a message you write, gives them a role, and says goodbye when they leave.

## Setup on FadeHost
1. Create a bot at https://discord.com/developers/applications: New Application, Bot, Reset Token.
2. Under Bot, Privileged Gateway Intents, turn on **Server Members Intent** (joins and leaves never arrive without it).
3. Invite it with the `bot` and `applications.commands` scopes and the **Manage Roles** (for the automatic role) and **Send Messages** permissions. Put the bot's role above the role it hands out.
4. In your FadeHost panel, deploy the **Welcome Bot** template and paste the token as `DISCORD_TOKEN`.
5. In Discord: `/welcome channel #welcome`, `/welcome message Welcome {user} to {server}!`, `/welcome role @Member`, then `/welcome test`.

## Commands
| Command | What it does |
|---|---|
| `/welcome channel #channel` | Where welcome messages go. |
| `/welcome message text` | The welcome text. `{user}` mentions the member, `{username}`, `{server}` and `{count}` fill themselves in. |
| `/welcome role [@role]` | The role every new member gets; leave it out to stop. |
| `/welcome dm on/off` | Also send the welcome as a direct message. |
| `/welcome test` | Shows you the welcome message as it would appear. |
| `/welcome status` | What is set up. |
| `/goodbye channel [#channel]` | Where goodbye messages go; leave it out to stop them. |
| `/goodbye message text` | The goodbye text. |

## Environment variables
| Variable | Default | What it does |
|---|---|---|
| `DISCORD_TOKEN` | | **Required.** Your bot token. |
| `WELCOME_CHANNEL_ID` | | Optional default welcome channel (or use `/welcome channel`). |
| `WELCOME_MESSAGE` | | Optional default welcome text. |
| `AUTO_ROLE_ID` | | Optional default role for new members. |
| `GOODBYE_CHANNEL_ID` | | Optional default goodbye channel. |
| `GOODBYE_MESSAGE` | | Optional default goodbye text. |

Settings are saved to the bot's persistent storage, so they survive restarts.

Built and maintained by [FadeHost](https://fadehost.com). MIT licensed.
