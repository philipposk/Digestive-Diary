# Auth & deployment setup

Digestive Diary uses the shared **6x7** Supabase project (`fmrnqepyyjucnfbrqawl`) — same pattern as smoking-app, topia, etc.

## Vercel

- **Project:** `digestive-diary`
- **Production URL:** https://digestive-diary-filippos-projects-06f05211.vercel.app
- Env vars configured: `NEXT_PUBLIC_USE_CLOUD`, Supabase URL/anon key, API keys, `NEXT_PUBLIC_SITE_URL`

## Local

Copy `.env.local.example` → `.env.local` (already filled if you pulled latest).

```bash
npm run dev
```

Visit `/login` → **Continue with Google**.

## Supabase redirect URLs (required once)

In [Supabase → 6x7 → Authentication → URL Configuration](https://supabase.com/dashboard/project/fmrnqepyyjucnfbrqawl/auth/url-configuration), add:

```
http://localhost:3000/auth/callback
https://digestive-diary-filippos-projects-06f05211.vercel.app/auth/callback
https://digestive-diary-*.vercel.app/auth/callback
```

Google provider is already enabled on this project (used by your other apps).

## Database

Tables applied via migration `digestive_diary_v1`:

- `food_logs`, `symptoms`, `contexts`, `experiments`, `experiment_logs`, `realizations`
- `diary_sources`, `diary_recipes`, `diary_photo_uploads`, `diary_admin_notifications`, `diary_settings`
- Storage bucket: `diary-photos`

RLS: every row scoped to `auth.uid()`.
