# Auth & deployment setup

Digestive Diary uses the shared **6x7** Supabase project (`fmrnqepyyjucnfbrqawl`) — same pattern as smoking-app, topia, etc.

## Vercel

- **Project:** `digestive-diary`
- **Production URL:** https://digestive.6x7.gr (also https://digestive-diary.vercel.app)
- **Note:** The `*-filippos-projects-06f05211.vercel.app` URL has Vercel SSO — use the custom domain or `digestive-diary.vercel.app` for Google sign-in.
- Env vars configured: `NEXT_PUBLIC_USE_CLOUD`, Supabase URL/anon key, API keys, `NEXT_PUBLIC_SITE_URL`

## Local

Copy `.env.local.example` → `.env.local` (already filled if you pulled latest).

```bash
npm run dev
```

Visit `/login` → **Continue with Google**.

## Supabase redirect URLs

Configured on the shared **6x7** project (`uri_allow_list` includes):

```
http://localhost:3000/**
https://*.6x7.gr/**
https://digestive-diary.vercel.app/**
https://digestive-diary-filippos-projects-06f05211.vercel.app/**
https://digestive-diary-*-filippos-projects-06f05211.vercel.app/**
```

Google provider is already enabled on this project (used by your other apps).

## Database

Migrations applied on the shared **6x7** project:

- **`digestive_diary_v1`** — core tables: `food_logs`, `symptoms`, `contexts`, `experiments`, `experiment_logs`, `realizations`, `sources`, `recipes`, `photo_uploads`, `admin_notifications`, `settings`
- **`digestive_diary_extended_sync_v2`** — extra columns: symptom `locations`; context `bristol_type`, `cycle_phase`, `cycle_flow`, `hydration_ml`; experiment `fodmap`, `target_days`
- **`digestive_diary_extended_sync_v3`** — `medications`, `medication_logs`, `custom_factors`, `custom_factor_logs`, `chat_sessions`

Storage bucket: **`user-photos`** (private; owner-folder RLS). Symptom photos sync as `storage:{userId}/…` refs.

RLS: every row scoped to `auth.uid()`.

Canonical schema reference: `lib/supabase/schema.sql`.
