-- Digestive Diary — Supabase schema (v1)
-- Apply to a fresh project via:  supabase db push  /  psql -f schema.sql
-- All tables are owner-scoped; RLS policies pin every row to auth.uid().

create extension if not exists "pgcrypto";

------------------------------------------------------------------------------
-- food_logs
------------------------------------------------------------------------------
create table if not exists public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  food text not null,
  quantity text,
  tags text[] not null default '{}',
  notes text,
  macros jsonb,
  portion_weight numeric,
  timestamp timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists food_logs_user_ts_idx on public.food_logs (user_id, timestamp desc);

------------------------------------------------------------------------------
-- symptoms
------------------------------------------------------------------------------
create table if not exists public.symptoms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  severity smallint not null check (severity between 1 and 10),
  duration text,
  notes text,
  linked_food_id uuid references public.food_logs(id) on delete set null,
  linked_symptom_id uuid references public.symptoms(id) on delete set null,
  photo_url text,
  ai_analysis jsonb,
  locations jsonb,
  timestamp timestamptz not null default now()
);
create index if not exists symptoms_user_ts_idx on public.symptoms (user_id, timestamp desc);
create index if not exists symptoms_user_type_idx on public.symptoms (user_id, type);

------------------------------------------------------------------------------
-- contexts (sleep / stress / activity / bowel)
------------------------------------------------------------------------------
create table if not exists public.contexts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sleep_quality text,
  sleep_duration numeric,
  sleep_start_time timestamptz,
  sleep_end_time timestamptz,
  stress_level text,
  activity_level text,
  bowel_movement boolean,
  bowel_type text,
  bristol_type smallint,
  cycle_phase text,
  cycle_flow text,
  hydration_ml numeric,
  notes text,
  timestamp timestamptz not null default now()
);
create index if not exists contexts_user_ts_idx on public.contexts (user_id, timestamp desc);

------------------------------------------------------------------------------
-- experiments + experiment_logs
------------------------------------------------------------------------------
create table if not exists public.experiments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  start_date timestamptz not null,
  end_date timestamptz,
  active boolean not null default true,
  notes text,
  fodmap jsonb,
  target_days integer
);
create index if not exists experiments_user_idx on public.experiments (user_id, start_date desc);

create table if not exists public.experiment_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  experiment_id uuid not null references public.experiments(id) on delete cascade,
  type text not null check (type in ('text','audio','image','video')),
  content text not null,
  notes text,
  timestamp timestamptz not null default now()
);
create index if not exists experiment_logs_user_idx on public.experiment_logs (user_id, experiment_id, timestamp desc);

------------------------------------------------------------------------------
-- realizations
------------------------------------------------------------------------------
create table if not exists public.realizations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  linked_data jsonb,
  ai_organized text,
  timestamp timestamptz not null default now()
);
create index if not exists realizations_user_ts_idx on public.realizations (user_id, timestamp desc);

------------------------------------------------------------------------------
-- sources (knowledge base)
------------------------------------------------------------------------------
create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  type text not null check (type in ('book','article','video','pdf','other')),
  url text,
  file_path text,
  description text,
  author text,
  content text,
  tags text[],
  added_at timestamptz not null default now()
);
create index if not exists sources_user_idx on public.sources (user_id, added_at desc);

------------------------------------------------------------------------------
-- recipes
------------------------------------------------------------------------------
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  ingredients text[] not null,
  instructions text[] not null,
  tags text[] not null default '{}',
  estimated_macros jsonb,
  source_url text,
  source_name text,
  ai_generated boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists recipes_user_idx on public.recipes (user_id, created_at desc);

------------------------------------------------------------------------------
-- photo_uploads
------------------------------------------------------------------------------
create table if not exists public.photo_uploads (
  id text primary key,                          -- app-generated fingerprint
  user_id uuid not null references auth.users(id) on delete cascade,
  file_url text not null,
  parsed_content text,
  food_log_id uuid references public.food_logs(id) on delete set null,
  uploaded_at timestamptz not null default now()
);
create index if not exists photo_uploads_user_idx on public.photo_uploads (user_id, uploaded_at desc);

------------------------------------------------------------------------------
-- admin_notifications
------------------------------------------------------------------------------
create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('recipe_source_error','api_error','other')),
  message text not null,
  details jsonb,
  resolved boolean not null default false,
  timestamp timestamptz not null default now()
);
create index if not exists admin_notifications_user_idx on public.admin_notifications (user_id, timestamp desc);

------------------------------------------------------------------------------
-- settings — one row per user
------------------------------------------------------------------------------
create table if not exists public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  fasting jsonb,
  macro_goals jsonb,
  auto_scan jsonb,
  recipe_sources jsonb,
  theme text,
  updated_at timestamptz not null default now()
);

------------------------------------------------------------------------------
-- medications + medication_logs
------------------------------------------------------------------------------
create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  dose text,
  active boolean not null default true,
  notes text,
  added_at timestamptz not null default now()
);
create index if not exists medications_user_idx on public.medications (user_id, added_at desc);

create table if not exists public.medication_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  medication_id uuid not null references public.medications(id) on delete cascade,
  notes text,
  timestamp timestamptz not null default now()
);
create index if not exists medication_logs_user_idx on public.medication_logs (user_id, timestamp desc);

------------------------------------------------------------------------------
-- custom_factors + custom_factor_logs
------------------------------------------------------------------------------
create table if not exists public.custom_factors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  scale text not null,
  unit text,
  icon text,
  active boolean not null default true,
  added_at timestamptz not null default now()
);
create index if not exists custom_factors_user_idx on public.custom_factors (user_id, added_at desc);

create table if not exists public.custom_factor_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  factor_id uuid not null references public.custom_factors(id) on delete cascade,
  value numeric not null,
  notes text,
  timestamp timestamptz not null default now()
);
create index if not exists custom_factor_logs_user_idx on public.custom_factor_logs (user_id, timestamp desc);

------------------------------------------------------------------------------
-- chat_sessions — one row per user
------------------------------------------------------------------------------
create table if not exists public.chat_sessions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  session jsonb not null,
  updated_at timestamptz not null default now()
);

------------------------------------------------------------------------------
-- Row-Level Security: every table is owner-scoped on user_id
------------------------------------------------------------------------------
alter table public.food_logs           enable row level security;
alter table public.symptoms            enable row level security;
alter table public.contexts            enable row level security;
alter table public.experiments         enable row level security;
alter table public.experiment_logs     enable row level security;
alter table public.realizations        enable row level security;
alter table public.sources             enable row level security;
alter table public.recipes             enable row level security;
alter table public.photo_uploads       enable row level security;
alter table public.admin_notifications enable row level security;
alter table public.settings            enable row level security;
alter table public.medications         enable row level security;
alter table public.medication_logs     enable row level security;
alter table public.custom_factors      enable row level security;
alter table public.custom_factor_logs  enable row level security;
alter table public.chat_sessions       enable row level security;

-- Helper: apply the standard 4 policies to a table.
do $$
declare t text;
begin
  for t in
    select unnest(array[
      'food_logs','symptoms','contexts','experiments','experiment_logs',
      'realizations','sources','recipes','photo_uploads','admin_notifications','settings',
      'medications','medication_logs','custom_factors','custom_factor_logs','chat_sessions'
    ])
  loop
    execute format($f$drop policy if exists "owner select" on public.%I$f$, t);
    execute format($f$drop policy if exists "owner insert" on public.%I$f$, t);
    execute format($f$drop policy if exists "owner update" on public.%I$f$, t);
    execute format($f$drop policy if exists "owner delete" on public.%I$f$, t);
    execute format($f$create policy "owner select" on public.%I for select using (auth.uid() = user_id)$f$, t);
    execute format($f$create policy "owner insert" on public.%I for insert with check (auth.uid() = user_id)$f$, t);
    execute format($f$create policy "owner update" on public.%I for update using (auth.uid() = user_id)$f$, t);
    execute format($f$create policy "owner delete" on public.%I for delete using (auth.uid() = user_id)$f$, t);
  end loop;
end$$;

------------------------------------------------------------------------------
-- Storage bucket for symptom + food photos. Private; owner-folder RLS.
------------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('user-photos', 'user-photos', false)
on conflict (id) do nothing;

drop policy if exists "owner photos" on storage.objects;
create policy "owner photos"
  on storage.objects for all
  using (
    bucket_id = 'user-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'user-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
