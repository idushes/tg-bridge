import postgres, { type Sql } from 'postgres';

let client: Sql | null = null;
let initPromise: Promise<void> | null = null;

function getConnectionString() {
  return process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? null;
}

export function getSql() {
  if (!client) {
    const connectionString = getConnectionString();
    if (!connectionString) {
      throw new Error('DATABASE_URL or POSTGRES_URL is not set');
    }

    client = postgres(connectionString, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    });
  }

  return client;
}

export function initDb() {
  if (!initPromise) {
    initPromise = (async () => {
      const sql = getSql();

      await sql`
        create table if not exists bots (
          bot_id bigint primary key,
          bot_token text not null,
          bot_username text not null,
          bot_name text not null,
          owner_telegram_id bigint not null,
          invite_token uuid not null unique,
          created_at timestamptz not null default now()
        )
      `;

      await sql`create index if not exists bots_owner_idx on bots (owner_telegram_id)`;

      await sql`
        create table if not exists chats (
          id bigserial primary key,
          bot_id bigint not null references bots(bot_id) on delete cascade,
          participant_chat_id bigint not null,
          participant_name text not null,
          participant_first_name text,
          participant_last_name text,
          participant_username text,
          last_message_text text,
          last_message_media_type text,
          last_message_from text,
          message_limit integer not null default 100,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now(),
          unique (bot_id, participant_chat_id)
        )
      `;

      await sql`alter table chats add column if not exists last_message_text text`;
      await sql`alter table chats add column if not exists last_message_media_type text`;
      await sql`alter table chats add column if not exists last_message_from text`;

      await sql`create index if not exists chats_bot_updated_idx on chats (bot_id, updated_at desc)`;

      await sql`
        create table if not exists messages (
          id uuid primary key,
          chat_row_id bigint not null references chats(id) on delete cascade,
          seq bigserial not null unique,
          sender_role text not null check (sender_role in ('user', 'operator')),
          text text not null default '',
          media_type text,
          media_file_id text,
          media_url text,
          created_at timestamptz not null default now()
        )
      `;

      await sql`create index if not exists messages_chat_seq_idx on messages (chat_row_id, seq desc)`;
      await sql`create index if not exists messages_chat_created_idx on messages (chat_row_id, created_at asc)`;

      await sql`
        create table if not exists push_subscriptions (
          id text primary key,
          bot_id bigint not null references bots(bot_id) on delete cascade,
          endpoint text not null,
          p256dh text not null,
          auth text not null,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now(),
          unique (bot_id, endpoint)
        )
      `;

      await sql`create index if not exists push_subscriptions_bot_idx on push_subscriptions (bot_id)`;

      await sql`
        create table if not exists push_presence (
          bot_id bigint not null references bots(bot_id) on delete cascade,
          client_id text not null,
          subscription_id text references push_subscriptions(id) on delete set null,
          active_chat_id bigint,
          updated_at timestamptz not null default now(),
          primary key (bot_id, client_id)
        )
      `;

      await sql`create index if not exists push_presence_lookup_idx on push_presence (bot_id, active_chat_id, updated_at desc)`;
    })();
  }

  return initPromise;
}
