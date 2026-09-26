# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Digestive Diary is a Next.js 14 (App Router) web app for tracking digestive disorders. All state is stored in browser localStorage (no external database). AI features (OpenAI/Groq) are optional; core food/symptom logging works without API keys.

### Quick Reference

| Action | Command |
|--------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (port 3000) |
| Lint | `npm run lint` |
| Build | `npm run build` |

### Environment Variables

Create `.env.local` in the project root (not committed to git):

- `OPENAI_API_KEY` - Required only for AI features (chat, voice, image analysis, summaries)
- `GROQ_API_KEY` - Optional, enables fast suggestions via Groq API

Core logging functionality works with placeholder/missing API keys.

### Notes

- No database or Docker needed. Data persists in browser localStorage.
- The dev server serves both frontend and all API routes.
- Lint produces only warnings (no errors) in the current codebase - `<img>` usage warnings and a React Hook dependency warning are pre-existing.
- No automated test suite exists; testing is manual via the browser.
