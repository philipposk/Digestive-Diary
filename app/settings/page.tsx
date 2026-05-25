'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import {
  getTheme, setTheme, applyTheme,
  getVibeId, setVibe, getAccentHex, setAccent,
  type Theme,
} from '@/lib/theme';
import { VIBES, VibeId } from '@/lib/themeTokens';
import { runScan } from '@/lib/autoScanScheduler';
import PageHeader from '@/components/ui/PageHeader';

export default function SettingsPage() {
  const [currentTheme, setCurrentTheme] = useState<Theme>('system');
  const [currentVibe, setCurrentVibe] = useState<VibeId>('clinical');
  const [currentAccent, setCurrentAccent] = useState<string>('#3f5a3c');

  const fastingSettings = useAppStore((s) => s.fastingSettings);
  const setFastingSettings = useAppStore((s) => s.setFastingSettings);
  const autoScanSettings = useAppStore((s) => s.autoScanSettings);
  const setAutoScanSettings = useAppStore((s) => s.setAutoScanSettings);
  const recipeSourcesSettings = useAppStore((s) => s.recipeSourcesSettings);
  const setRecipeSourcesSettings = useAppStore((s) => s.setRecipeSourcesSettings);
  const addFoodLog = useAppStore((s) => s.addFoodLog);
  const addPhotoUpload = useAppStore((s) => s.addPhotoUpload);
  const photoUploads = useAppStore((s) => s.photoUploads);

  useEffect(() => {
    setCurrentTheme(getTheme());
    setCurrentVibe(getVibeId());
    setCurrentAccent(getAccentHex());
  }, []);

  const handleThemeChange = (t: Theme) => {
    setTheme(t); applyTheme(t); setCurrentTheme(t);
  };
  const handleVibeChange = (v: VibeId) => {
    setVibe(v); setCurrentVibe(v); setCurrentAccent(getAccentHex());
  };
  const handleAccentChange = (hex: string) => {
    setAccent(hex); setCurrentAccent(hex);
  };

  const vibe = VIBES[currentVibe];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <PageHeader eyebrow="Profile" title="Settings" />

      <Section title="Appearance" eyebrow="Visual">
        <Field label="Vibe">
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(VIBES) as VibeId[]).map((id) => {
              const v = VIBES[id];
              const on = currentVibe === id;
              const preview = v.light;
              return (
                <button
                  key={id}
                  onClick={() => handleVibeChange(id)}
                  className="text-left px-3 py-2.5 rounded-card transition-colors"
                  style={{
                    background: on ? 'var(--ink)' : 'var(--surface)',
                    color: on ? 'var(--bg)' : 'var(--ink)',
                    border: `1px solid ${on ? 'var(--ink)' : 'var(--border)'}`,
                  }}
                >
                  <div
                    className="flex gap-1 mb-1.5"
                    aria-hidden
                  >
                    {[preview.bg, preview.surface, v.accents[0].hex].map((c, i) => (
                      <span key={i} style={{ width: 14, height: 14, borderRadius: 3, background: c, border: '1px solid rgba(0,0,0,0.08)' }} />
                    ))}
                  </div>
                  <div className="text-[12.5px] font-medium">{v.label}</div>
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Accent">
          <div className="flex flex-wrap gap-2">
            {vibe.accents.map((a) => {
              const on = currentAccent === a.hex;
              return (
                <button
                  key={a.hex}
                  onClick={() => handleAccentChange(a.hex)}
                  className="px-2.5 py-1.5 rounded-full text-[12px] inline-flex items-center gap-1.5 transition-colors"
                  style={{
                    background: on ? a.hex : 'transparent',
                    color: on ? '#fff' : 'var(--ink-soft)',
                    border: `1px solid ${on ? a.hex : 'var(--border)'}`,
                  }}
                >
                  <span style={{ width: 10, height: 10, borderRadius: 10, background: a.hex, display: 'inline-block' }} />
                  {a.name}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Mode">
          <div className="grid grid-cols-3 gap-2">
            {(['light', 'dark', 'system'] as Theme[]).map((t) => {
              const on = currentTheme === t;
              return (
                <button
                  key={t}
                  onClick={() => handleThemeChange(t)}
                  className="px-3 py-2 rounded-card text-[13px] capitalize transition-colors"
                  style={{
                    background: on ? 'var(--ink)' : 'transparent',
                    color: on ? 'var(--bg)' : 'var(--ink)',
                    border: `1px solid ${on ? 'var(--ink)' : 'var(--border)'}`,
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </Field>
      </Section>

      <Section title="Fasting" eyebrow="Schedule">
        <Toggle
          label="Enable fasting status"
          checked={fastingSettings.enabled}
          onChange={(v) => setFastingSettings({ ...fastingSettings, enabled: v })}
        />
        {fastingSettings.enabled && (
          <>
            <Field label="Fasting window (hours)">
              <input
                type="number" min={1} max={24}
                value={fastingSettings.fastingWindow}
                onChange={(e) => setFastingSettings({ ...fastingSettings, fastingWindow: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
                style={{ border: '1px solid var(--border)' }}
              />
            </Field>
            <Field label="Eating window (hours)">
              <input
                type="number" min={1} max={24}
                value={fastingSettings.eatingWindow}
                onChange={(e) => setFastingSettings({ ...fastingSettings, eatingWindow: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
                style={{ border: '1px solid var(--border)' }}
              />
            </Field>
          </>
        )}
      </Section>

      <Section title="Auto-scan photos" eyebrow="Album">
        <p className="text-[12.5px] muted m-0">
          When the app is open, prompts you to pick recent album photos on schedule. Dedups against already-processed images.
        </p>
        <Toggle
          label="Enable auto-scan"
          checked={autoScanSettings.enabled}
          onChange={(v) => setAutoScanSettings({ ...autoScanSettings, enabled: v })}
        />
        {autoScanSettings.enabled && (
          <Field label="Frequency">
            <div className="flex gap-2">
              {(['manual', 'hourly', 'daily'] as const).map((f) => {
                const on = autoScanSettings.frequency === f;
                return (
                  <button
                    key={f}
                    onClick={() => setAutoScanSettings({ ...autoScanSettings, frequency: f })}
                    className="px-3 py-1.5 rounded-full text-[12px] capitalize"
                    style={{
                      background: on ? 'var(--ink)' : 'transparent',
                      color: on ? 'var(--bg)' : 'var(--ink-soft)',
                      border: `1px solid ${on ? 'var(--ink)' : 'var(--border)'}`,
                    }}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </Field>
        )}
        <button
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file'; input.accept = 'image/*'; input.multiple = true;
            input.onchange = async (e) => {
              const files = Array.from((e.target as HTMLInputElement).files || []);
              if (files.length === 0) return;
              const r = await runScan(files, autoScanSettings, photoUploads, {
                addFoodLog, addPhotoUpload, setAutoScanSettings,
              });
              alert(`Logged ${r.processed}. Skipped ${r.skipped} dupes. ${r.notFood} not food. ${r.failed} failed.`);
            };
            input.click();
          }}
          className="px-3 py-2 rounded-full text-[13px]"
          style={{ background: 'var(--ink)', color: 'var(--bg)' }}
        >
          Scan now
        </button>
        {autoScanSettings.lastScanTime && (
          <p className="text-[11.5px] muted m-0 mt-1">
            Last scan: {new Date(autoScanSettings.lastScanTime).toLocaleString()} · {autoScanSettings.processedPhotos.length} photos remembered
          </p>
        )}
      </Section>

      <Section title="Recipe sources" eyebrow="Web">
        <p className="text-[12.5px] muted m-0">
          URLs the AI scrapes when you fetch recipes. Disable individual sources to filter them out.
        </p>
        <div className="space-y-1.5">
          {recipeSourcesSettings.sources.map((s, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={s.enabled}
                onChange={(e) => {
                  const next = [...recipeSourcesSettings.sources];
                  next[idx] = { ...s, enabled: e.target.checked };
                  setRecipeSourcesSettings({ sources: next });
                }}
              />
              <input
                value={s.url}
                onChange={(e) => {
                  const next = [...recipeSourcesSettings.sources];
                  next[idx] = { ...s, url: e.target.value };
                  setRecipeSourcesSettings({ sources: next });
                }}
                className="flex-1 px-3 py-1.5 rounded-card text-[13px] ink bg-app outline-none"
                style={{ border: '1px solid var(--border)' }}
              />
              <button
                onClick={() =>
                  setRecipeSourcesSettings({
                    sources: recipeSourcesSettings.sources.filter((_, i) => i !== idx),
                  })
                }
                className="muted hover:text-ink text-[12px]"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setRecipeSourcesSettings({ sources: [...recipeSourcesSettings.sources, { url: '', enabled: true }] })}
            className="px-3 py-1.5 rounded-full text-[12.5px]"
            style={{ border: '1px solid var(--border-strong)', color: 'var(--ink-soft)' }}
          >
            + Add URL
          </button>
          <button
            onClick={async () => {
              const enabled = recipeSourcesSettings.sources.filter((s) => s.enabled);
              if (enabled.length === 0) { alert('Enable at least one source.'); return; }
              try {
                const r = await fetch('/api/recipes/fetch-from-sources', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ sources: enabled }),
                });
                const d = await r.json();
                if (d.errors?.length) {
                  const add = useAppStore.getState().addAdminNotification;
                  d.errors.forEach((err: any) => add({
                    type: 'recipe_source_error',
                    message: `Failed to fetch from ${err.url}`,
                    details: { error: err.error, url: err.url },
                    resolved: false,
                  }));
                }
                if (d.recipes?.length) {
                  const setRecipes = useAppStore.getState().setRecipes;
                  const cur = useAppStore.getState().recipes;
                  setRecipes([...cur, ...d.recipes]);
                  alert(`Fetched ${d.recipes.length} recipes${d.errors?.length ? ` (${d.errors.length} errors — see Admin).` : '.'}`);
                } else if (d.errors?.length) {
                  alert(`No recipes. ${d.errors.length} errors — see Admin.`);
                } else {
                  alert('No recipes found in enabled sources.');
                }
              } catch (err: any) {
                const add = useAppStore.getState().addAdminNotification;
                add({ type: 'api_error', message: 'Failed to fetch recipes', details: { error: err.message }, resolved: false });
                alert('Fetch error — see Admin.');
              }
            }}
            className="px-3 py-1.5 rounded-full text-[12.5px]"
            style={{ background: 'var(--ink)', color: 'var(--bg)' }}
          >
            Fetch now
          </button>
        </div>
      </Section>

      <Section title="Data" eyebrow="Export · Manage">
        <div className="space-y-1.5">
          {[
            { href: '/timeline',     label: 'Timeline view' },
            { href: '/realizations', label: 'My realizations' },
            { href: '/chat',         label: 'AI chat' },
            { href: '/sources',      label: 'Knowledge sources' },
            { href: '/macros',       label: 'Macronutrients' },
            { href: '/recipes',      label: 'Recipes' },
            { href: '/admin',        label: 'Admin notifications' },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block px-3 py-2.5 rounded-card text-[13.5px] ink hover:bg-surf-alt transition-colors"
              style={{ border: '1px solid var(--border)' }}
            >
              {l.label} →
            </Link>
          ))}
          <button
            onClick={() => {
              const store = useAppStore.getState();
              const data = {
                foodLogs: store.foodLogs,
                symptoms: store.symptoms,
                contexts: store.contexts,
                experiments: store.experiments,
                realizations: store.realizations,
                exportedAt: new Date().toISOString(),
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = `digestive-diary-export-${new Date().toISOString().split('T')[0]}.json`;
              document.body.appendChild(a); a.click(); document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="w-full text-left px-3 py-2.5 rounded-card text-[13.5px] ink hover:bg-surf-alt transition-colors"
            style={{ border: '1px solid var(--border)' }}
          >
            Export data for doctor (JSON) →
          </button>
          <button
            onClick={() => {
              if (!confirm('Delete ALL data? Cannot be undone.')) return;
              const s = useAppStore.getState();
              s.setFoodLogs([]); s.setSymptoms([]); s.setContexts([]); s.setExperiments([]);
              s.clearChatSession();
              [...s.realizations].forEach((r) => s.deleteRealization(r.id));
              alert('All data deleted.');
            }}
            className="w-full text-left px-3 py-2.5 rounded-card text-[13.5px] transition-colors"
            style={{ border: '1px solid var(--border)', color: '#c44' }}
          >
            Delete all data →
          </button>
        </div>
      </Section>

      <Section title="About" eyebrow="Meta">
        <p className="text-[12.5px] ink-soft m-0">
          Digestive Diary · v0.2 · A non-judgmental tracking tool. Not medical advice.
        </p>
      </Section>
    </div>
  );
}

function Section({ children, title, eyebrow }: { children: React.ReactNode; title: string; eyebrow?: string }) {
  return (
    <section className="px-5 pb-6">
      <div className="mb-2">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2 className="m-0 mt-0.5 font-heading text-[18px] tracking-head ink">{title}</h2>
      </div>
      <div className="card p-4 space-y-3">{children}</div>
    </section>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-[13.5px] ink-soft">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        className="w-10 h-6 rounded-full transition-colors"
        style={{
          background: checked ? 'var(--accent)' : 'var(--border)',
          padding: 2,
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 18, height: 18, borderRadius: 18,
            background: '#fff',
            transform: checked ? 'translateX(16px)' : 'translateX(0)',
            transition: 'transform .15s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      </button>
    </label>
  );
}
