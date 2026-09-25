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

Tables applied via migration `digestive_diary_v1`:

- `food_logs`, `symptoms`, `contexts`, `experiments`, `experiment_logs`, `realizations`
- `diary_sources`, `diary_recipes`, `diary_photo_uploads`, `diary_admin_notifications`, `diary_settings`
- Storage bucket: `diary-photos`

RLS: every row scoped to `auth.uid()`.
