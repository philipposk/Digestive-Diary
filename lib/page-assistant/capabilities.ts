import {
  capability,
  markdownLink,
  explainUiCapability,
  type Capability,
} from '@page-assistant/widget';
import { useAppStore } from '@/lib/store';
import { generateInsights } from '@/lib/generateInsights';

const toDate = (v: Date | string) => (v instanceof Date ? v : new Date(v));

export function buildCapabilities(onNavigate: (href: string) => void): Capability[] {
  return [
    capability({
      name: 'search_food_logs',
      description: 'Search the user\'s food logs by keyword.',
      parameters: {
        type: 'object',
        properties: { q: { type: 'string', description: 'Search text' } },
        required: ['q'],
      },
      run: async ({ q }) => {
        const needle = String(q ?? '').trim().toLowerCase();
        const items = useAppStore.getState().foodLogs
          .filter((f) =>
            f.food.toLowerCase().includes(needle)
            || (f.notes ?? '').toLowerCase().includes(needle)
            || (f.tags ?? []).some((t) => t.toLowerCase().includes(needle))
          )
          .slice(0, 8)
          .map((f) => ({
            id: f.id,
            food: f.food,
            when: toDate(f.timestamp).toISOString(),
          }));
        return { count: items.length, items };
      },
      render: (r) => {
        if (!r.count) return 'No food logs matched that search.';
        const links = r.items.slice(0, 5).map((i: { food: string }) => markdownLink(i.food, '/timeline'));
        return `Found ${r.count} entries: ${links.join(', ')}.`;
      },
    }),

    capability({
      name: 'search_symptoms',
      description: 'Search the user\'s symptom logs by type or notes.',
      parameters: {
        type: 'object',
        properties: { q: { type: 'string' } },
        required: ['q'],
      },
      run: async ({ q }) => {
        const needle = String(q ?? '').trim().toLowerCase();
        const items = useAppStore.getState().symptoms
          .filter((s) =>
            s.type.toLowerCase().includes(needle)
            || (s.notes ?? '').toLowerCase().includes(needle)
          )
          .slice(0, 8)
          .map((s) => ({
            type: s.type,
            severity: s.severity,
            when: toDate(s.timestamp).toISOString(),
          }));
        return { count: items.length, items };
      },
      render: (r) => {
        if (!r.count) return 'No symptoms matched that search.';
        const summary = r.items
          .slice(0, 5)
          .map((i: { type: string; severity: number }) => `${i.type} (severity ${i.severity})`)
          .join(', ');
        return `Found ${r.count} symptom entries: ${summary}. See ${markdownLink('Timeline', '/timeline')}.`;
      },
    }),

    capability({
      name: 'summarize_insights',
      description: 'Summarize pattern cards from the user\'s logged data.',
      parameters: { type: 'object', properties: {} },
      run: async () => {
        const s = useAppStore.getState();
        const patterns = generateInsights(
          s.foodLogs,
          s.symptoms,
          s.experiments,
          s.medications,
          s.medicationLogs,
          s.customFactors,
          s.customFactorLogs,
        );
        return {
          count: patterns.length,
          items: patterns.slice(0, 6).map((p) => ({ description: p.description, confidence: p.confidence })),
        };
      },
      render: (r) => {
        if (!r.count) {
          return `No patterns yet — keep logging food and symptoms, then check ${markdownLink('Insights', '/insights')}.`;
        }
        const lines = r.items.map((p: { description: string; confidence: string }) => `${p.description} (${p.confidence} confidence)`);
        return `${r.count} pattern(s) in your data:\n${lines.join('\n')}\nOpen ${markdownLink('Insights', '/insights')} for details. Not medical advice.`;
      },
    }),

    capability({
      name: 'list_experiments',
      description: 'List active and past diet experiments.',
      parameters: { type: 'object', properties: {} },
      run: async () => {
        const experiments = useAppStore.getState().experiments;
        return {
          active: experiments.filter((e) => !e.endDate).map((e) => e.name),
          past: experiments.filter((e) => e.endDate).slice(0, 5).map((e) => e.name),
        };
      },
      render: (r) => {
        const active = r.active.length ? r.active.join(', ') : 'none';
        const past = r.past.length ? r.past.join(', ') : 'none';
        return `Active experiments: ${active}. Past: ${past}. Manage them in ${markdownLink('Lab', '/experiments')}.`;
      },
    }),

    capability({
      name: 'open_page',
      description: 'Navigate to a main app page.',
      parameters: {
        type: 'object',
        properties: {
          page: {
            type: 'string',
            description: 'One of: today, timeline, insights, experiments, settings',
          },
        },
        required: ['page'],
      },
      run: async ({ page }) => {
        const routes: Record<string, string> = {
          today: '/',
          timeline: '/timeline',
          insights: '/insights',
          experiments: '/experiments',
          lab: '/experiments',
          settings: '/settings',
          profile: '/settings',
        };
        const href = routes[String(page).toLowerCase()];
        if (!href) return { ok: false, reason: 'unknown page' };
        onNavigate(href);
        return { ok: true, href };
      },
      render: (r) => (r.ok ? 'Opening that page for you.' : 'That page is not available.'),
    }),

    explainUiCapability({
      name: 'explain_logging',
      description: 'Explain how to log food, symptoms, or context in this app.',
      run: async () => ({
        steps: [
          'On Today, tap Log Food or Log Symptom.',
          'Context logging covers sleep, stress, activity, and bowel notes.',
          'Everything appears on Timeline in time order.',
        ],
      }),
      render: (r) => r.steps.join(' '),
    }),
  ];
}
