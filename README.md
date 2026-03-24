# Telegram Bridge

Telegram bridge for family/private chats: messages go through a Telegram bot, while the recipient uses a web chat UI that now behaves close to Telegram on desktop and mobile.

## Stack

- Next.js App Router
- Neon Postgres for bots, chats, messages, push subscriptions, and presence
- SSE for active chat updates
- Web Push for closed/background tabs
- Telegram Bot API for transport and media files

## Environment

Copy `.env.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
NEXT_PUBLIC_TELEGRAM_BOT_ID=your_bot_username
NEXT_PUBLIC_AUTH_CALLBACK_URL=https://your-domain.vercel.app
DEFAULT_MESSAGE_LIMIT=100
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

Notes:

- `DATABASE_URL` can be replaced with `POSTGRES_URL`
- generate VAPID keys with `npx web-push generate-vapid-keys`
- media files are not stored in Postgres; only Telegram `file_id` values are stored

## Local Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Quick Start

1. Create a Neon database and copy its connection string into `DATABASE_URL`
2. Generate VAPID keys with `npx web-push generate-vapid-keys`
3. Copy `.env.example` to `.env.local` and fill in all required values
4. Run `npm install` and `npm run dev`
5. Open `/admin`, add a bot token, then use the generated public chat link

## Current Architecture

- `bots` are stored in Postgres with `invite_token`
- `chats` and `messages` are stored in Postgres
- active open chat receives updates through `SSE` at `/api/chats/[chatId]/events`
- closed tabs and other chats receive browser push notifications through a service worker
- incoming and outgoing media still use Telegram file storage and are proxied by `app/api/media/[messageId]/route.ts`

## Important Migration Note

Blob storage was removed. Old Blob data is not migrated automatically.

If you switched from the old version, create bots again through the admin UI so they exist in Postgres.

## Useful Checks

- `GET /api/status` shows whether base env values are present
- `npm run build` validates the production build
- `npm run lint` runs ESLint; there are still a few unrelated warnings in admin code

## Deployment

The repo is deployed through Vercel.

- commit and push changes
- Vercel deploys automatically from the pushed branch
