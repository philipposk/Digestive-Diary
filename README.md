# Digestive Diary

Digestive Diary is an app for keeping a simple, judgment-free log of what you eat and how your stomach feels. Over time it spots patterns — like a food that tends to come before discomfort — and helps you put together a clear summary to share with your doctor. It's for people managing digestive problems who want to understand their own body better. It is a tracking tool, not medical advice.

## What it does
- Quickly log meals, with optional notes and amounts
- Record symptoms, how bad they were (1-10), and how long they lasted
- See everything on a timeline, in the order it happened
- Run "experiments" to test how a diet change affects you over a period
- Points out patterns in your data in plain language (not a diagnosis)
- Log entries by speaking instead of typing
- Create a tidy summary to bring to a doctor's visit

It deliberately leaves out calorie counting, nutrition scores, "good/bad" food labels, daily goals, and points or streaks.

## Status
Working app, designed mobile-first (meant to be used comfortably on a phone browser). The folder is named "Tsekas project" but the app itself is "Digestive Diary."

---
### For developers
Built with Next.js 14 (App Router) and TypeScript, styled with Tailwind CSS (mobile-first). State managed with Zustand. AI features use the OpenAI API (GPT models plus Whisper for voice), with Groq as a faster optional backend.

Key folders: `app/` (pages and API routes), `components/`, `lib/`, `types/`, `public/`. Setup: `npm install`, create `.env.local` with `OPENAI_API_KEY` (and optionally `GROQ_API_KEY`), then `npm run dev` and open http://localhost:3000. All AI features are non-medical — they describe patterns only, never diagnose.
