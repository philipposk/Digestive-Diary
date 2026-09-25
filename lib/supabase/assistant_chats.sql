-- page-assistant: account-synced chat history — reference migration for Supabase.
--
-- Copy this file into your app's supabase/migrations/ (rename it with a timestamp) and apply
-- it the way you apply every other migration. It pairs with supabaseChatHistoryAdapter()
-- from @page-assistant/widget.
--
-- Access: row-level security. A signed-in user can read, add, change and delete only their
-- own rows. The anon role gets nothing. The widget reaches this table only through the
-- host's own supabase-js client, with the user's session.
--
-- Retention: chats with no activity for 12 months (updated_at) are deleted by
-- public.assistant_chats_delete_inactive(). Scheduled below with pg_cron when it is
-- enabled; see the end of the file for databases without it.

create table if not exists public.assistant_chats (
  id          text        not null check (char_length(id) between 1 and 128),
  user_id     uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  -- Keeps apps or workspaces that share one table apart. The adapter's `app` option.
  app         text        not null default '' check (char_length(app) <= 128),
  title       text        not null default 'New chat' check (char_length(title) <= 500),
  messages    jsonb       not null default '[]'::jsonb
                          check (jsonb_typeof(messages) = 'array')
                          -- Generous cap so one user cannot fill the database. The widget
                          -- keeps at most 100 messages per chat.
                          check (octet_length(messages::text) <= 5000000),
  pinned      boolean     not null default false,
  archived    boolean     not null default false,
  group_id    text,
  model       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- A chat id is unique only within one user's chats in one app: apps sharing this table
  -- must never overwrite each other's chat that happens to have the same id.
  primary key (user_id, app, id)
);

-- Earlier versions of this file keyed rows on (user_id, id), so an upsert from one app could
-- overwrite another app's chat with the same id. Re-key such a table; does nothing otherwise.
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.assistant_chats'::regclass
      and conname = 'assistant_chats_pkey'
      and pg_get_constraintdef(oid) = 'PRIMARY KEY (user_id, id)'
  ) then
    alter table public.assistant_chats drop constraint assistant_chats_pkey;
    alter table public.assistant_chats add constraint assistant_chats_pkey primary key (user_id, app, id);
  end if;
end;
$$;

-- The list: one user's chats in one app, newest first.
create index if not exists assistant_chats_user_app_updated_idx
  on public.assistant_chats (user_id, app, updated_at desc);
-- The retention sweep.
create index if not exists assistant_chats_updated_idx
  on public.assistant_chats (updated_at);

-- The client sends its own timestamps: created_at keeps a moved chat's real age, and
-- updated_at is its last activity. The widget counts a move from the device as activity, so
-- the sweep never deletes a chat right after the user was told it was moved.
-- It may never send one in the future: that would dodge the retention rule.
create or replace function public.assistant_chats_clamp_times()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := least(coalesce(new.updated_at, now()), now());
  new.created_at := least(coalesce(new.created_at, now()), new.updated_at);
  return new;
end;
$$;

drop trigger if exists assistant_chats_clamp_times on public.assistant_chats;
create trigger assistant_chats_clamp_times
  before insert or update on public.assistant_chats
  for each row execute function public.assistant_chats_clamp_times();

-- Row-level security: every policy is "the row is mine".
alter table public.assistant_chats enable row level security;

drop policy if exists "assistant_chats select own" on public.assistant_chats;
create policy "assistant_chats select own" on public.assistant_chats
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "assistant_chats insert own" on public.assistant_chats;
create policy "assistant_chats insert own" on public.assistant_chats
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "assistant_chats update own" on public.assistant_chats;
create policy "assistant_chats update own" on public.assistant_chats
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "assistant_chats delete own" on public.assistant_chats;
create policy "assistant_chats delete own" on public.assistant_chats
  for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.assistant_chats from anon;
grant select, insert, update, delete on table public.assistant_chats to authenticated;

-- Retention: delete chats with no activity for 12 months. Returns how many went.
create or replace function public.assistant_chats_delete_inactive()
returns integer
language plpgsql
set search_path = ''
as $$
declare
  deleted integer;
begin
  delete from public.assistant_chats
  where updated_at < now() - interval '12 months';
  get diagnostics deleted = row_count;
  return deleted;
end;
$$;

-- Only the database owner and the service role may run it; never a signed-in user.
revoke execute on function public.assistant_chats_delete_inactive() from public, anon, authenticated;
grant execute on function public.assistant_chats_delete_inactive() to service_role;

-- Schedule it daily at 03:17 UTC with pg_cron, when pg_cron is enabled
-- (Supabase: Database → Extensions → pg_cron). Re-running this file updates the same job.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'assistant-chats-retention',
      '17 3 * * *',
      'select public.assistant_chats_delete_inactive()'
    );
  else
    raise notice 'pg_cron is not enabled: schedule public.assistant_chats_delete_inactive() another way (see the end of assistant_chats.sql).';
  end if;
end;
$$;

-- Without pg_cron, run the same statement once a day from any scheduler that holds the
-- service-role key (a cron route, a scheduled function, a CI schedule — never a browser):
--
--   await supabaseAdmin.rpc("assistant_chats_delete_inactive")
--
-- or with a direct database connection:
--
--   psql "$DATABASE_URL" -c "select public.assistant_chats_delete_inactive()"
--
-- supabaseChatHistoryAdapter() also hides and deletes a user's own inactive chats each time
-- they open the assistant, but a user who never comes back is only covered by a scheduled run.
