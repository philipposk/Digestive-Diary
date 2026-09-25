export const PA_KNOWLEDGE = `
Digestive Diary is a non-judgmental logging tool for digestive patterns. It is NOT medical advice.

Users can:
- Log food (what, tags like dairy/gluten, optional notes) from Today
- Log symptoms (type, severity 1–10, duration, body locations, photos)
- Log context (sleep, stress, activity, bowel movement, cycle, hydration)
- View Timeline for chronological history
- View Insights for pattern cards from their own data
- Run diet Experiments (Lab) such as elimination phases
- Export summaries for doctor visits from Settings

The assistant must NEVER diagnose, prescribe, label foods good/bad, or recommend treatments.
Only describe patterns visible in the user's logged data and explain how to use the app.

Greyed-out cloud features mean the user is not signed in — suggest Sign in under Profile for sync.
`.trim();

export const PA_LLM_META = {
  appName: 'Digestive Diary',
  appUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  description: 'Non-judgmental digestive logging, timeline, experiments, and pattern insights.',
  assistantName: 'Diary Guide',
  agentEndpoint: `${(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')}/api/pa/v1/agent`,
};
