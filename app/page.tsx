'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import LogFoodModal from '@/components/modals/LogFoodModal';
import LogSymptomModal from '@/components/modals/LogSymptomModal';
import LogContextModal from '@/components/modals/LogContextModal';
import { generateSampleData } from '@/lib/generateSampleData';
import { FoodLog, Symptom } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import AIAnnotation from '@/components/ui/AIAnnotation';
import TimelineRow, { TimelineItem } from '@/components/ui/TimelineRow';
import { IconBowl, IconPulse, IconMoon, IconSearch } from '@/components/ui/Icon';
import { useT } from '@/lib/i18n';

const toDate = (v: Date | string) => (v instanceof Date ? v : new Date(v));

export default function HomePage() {
  const { t } = useT();
  const [today] = useState(new Date());
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [showSymptomModal, setShowSymptomModal] = useState(false);
  const [showContextModal, setShowContextModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);
  const [showClearDemoButton, setShowClearDemoButton] = useState(false);
  const [smartTip, setSmartTip] = useState<string | null>(null);
  const [smartTipLoading, setSmartTipLoading] = useState(false);

  const symptoms = useAppStore((s) => s.symptoms);
  const medications = useAppStore((s) => s.medications);
  const medicationLogs = useAppStore((s) => s.medicationLogs);
  const customFactors = useAppStore((s) => s.customFactors);
  const customFactorLogs = useAppStore((s) => s.customFactorLogs);
  const setFoodLogs = useAppStore((s) => s.setFoodLogs);
  const setSymptoms = useAppStore((s) => s.setSymptoms);
  const setContexts = useAppStore((s) => s.setContexts);
  const setExperiments = useAppStore((s) => s.setExperiments);
  const setRealizations = useAppStore((s) => s.setRealizations);
  const setChatSession = useAppStore((s) => s.setChatSession);
  const setSources = useAppStore((s) => s.setSources);
  const experiments = useAppStore((s) => s.experiments);
  const fastingSettings = useAppStore((s) => s.fastingSettings);
  const foodLogs = useAppStore((s) => s.foodLogs);

  useEffect(() => {
    if (localStorage.getItem('welcomeBannerDismissed') === 'true') setShowWelcomeBanner(false);
  }, []);

  useEffect(() => {
    const cleared = localStorage.getItem('demoDataCleared');
    const has = foodLogs.length > 0 || symptoms.length > 0 || experiments.length > 0;
    setShowClearDemoButton(!cleared && has);
  }, [foodLogs.length, symptoms.length, experiments.length]);

  useEffect(() => {
    if (foodLogs.length === 0) {
      const data = generateSampleData();
      setFoodLogs(data.foodLogs);
      setSymptoms(data.symptoms);
      setContexts(data.contexts);
      setExperiments(data.experiments);
      setRealizations(data.realizations);
      setChatSession(data.chatSession);
      setSources(data.sources);
    }
  }, [foodLogs.length, setFoodLogs, setSymptoms, setContexts, setExperiments, setRealizations, setChatSession, setSources]);

  // Groq smart tip (15-min sessionStorage cache).
  useEffect(() => {
    const CACHE_KEY = 'smartTip';
    const CACHE_AT = 'smartTipAt';
    const TTL = 15 * 60 * 1000;
    try {
      const at = Number(sessionStorage.getItem(CACHE_AT) || '0');
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached && Date.now() - at < TTL) {
        setSmartTip(cached);
        return;
      }
    } catch { /* ignore */ }
    const lastFood = foodLogs[0];
    const lastSymptom = symptoms[0];
    const hoursSinceFood = lastFood ? (Date.now() - toDate(lastFood.timestamp).getTime()) / 3.6e6 : null;
    const hoursSinceSymptom = lastSymptom ? (Date.now() - toDate(lastSymptom.timestamp).getTime()) / 3.6e6 : null;
    const hr = new Date().getHours();
    const partOfDay = hr < 5 ? 'late night' : hr < 11 ? 'morning' : hr < 15 ? 'midday' : hr < 18 ? 'afternoon' : hr < 22 ? 'evening' : 'night';
    const active = experiments.filter((e) => e.active).map((e) => e.name);
    const context = `Time of day: ${partOfDay}. `
      + (hoursSinceFood !== null ? `Hours since last food: ${hoursSinceFood.toFixed(1)}. ` : 'No food logged yet. ')
      + (hoursSinceSymptom !== null ? `Hours since last symptom: ${hoursSinceSymptom.toFixed(1)}. ` : '')
      + (active.length ? `Active experiments: ${active.join(', ')}.` : '');
    setSmartTipLoading(true);
    fetch('/api/groq/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context,
        userData: {
          lastFood: lastFood ? { food: lastFood.food, tags: lastFood.tags } : null,
          lastSymptom: lastSymptom ? { type: lastSymptom.type, severity: lastSymptom.severity } : null,
        },
      }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        const tip = typeof d?.suggestion === 'string' ? d.suggestion.trim() : '';
        if (tip) {
          setSmartTip(tip);
          try {
            sessionStorage.setItem(CACHE_KEY, tip);
            sessionStorage.setItem(CACHE_AT, String(Date.now()));
          } catch { /* ignore */ }
        }
      })
      .catch(() => undefined)
      .finally(() => setSmartTipLoading(false));
  }, [foodLogs, symptoms, experiments]);

  const handleDismissWelcome = () => {
    setShowWelcomeBanner(false);
    localStorage.setItem('welcomeBannerDismissed', 'true');
  };
  const handleClearDemoData = () => {
    if (!confirm('Clear all demo data and start fresh? Cannot be undone.')) return;
    setFoodLogs([]);
    setSymptoms([]);
    setContexts([]);
    setExperiments([]);
    setRealizations([]);
    setChatSession(null);
    setSources([]);
    localStorage.setItem('demoDataCleared', 'true');
    setShowClearDemoButton(false);
  };

  const todayItems = useMemo<TimelineItem[]>(() => {
    const start = new Date(today); start.setHours(0, 0, 0, 0);
    const end = new Date(today); end.setHours(23, 59, 59, 999);
    const items: TimelineItem[] = [];
    foodLogs.forEach((log) => {
      const t = toDate(log.timestamp);
      if (t >= start && t <= end) {
        items.push({
          id: log.id,
          kind: 'food',
          timestamp: t,
          title: log.food,
          detail: log.quantity,
          tags: log.tags,
        });
      }
    });
    symptoms.forEach((sym) => {
      const t = toDate(sym.timestamp);
      if (t >= start && t <= end) {
        const linked = sym.linkedFoodId ? foodLogs.find((f) => f.id === sym.linkedFoodId) : null;
        items.push({
          id: sym.id,
          kind: 'symptom',
          timestamp: t,
          title: sym.type,
          duration: sym.duration,
          severity: sym.severity,
          note: sym.notes,
          photoUrl: sym.photoUrl,
          linkedFoodTitle: linked?.food,
        });
      }
    });
    medicationLogs.forEach((log) => {
      const t = toDate(log.timestamp);
      if (t >= start && t <= end) {
        const med = medications.find((m) => m.id === log.medicationId);
        items.push({
          id: log.id,
          kind: 'context',
          timestamp: t,
          title: `💊 ${med?.name ?? 'Medication'}`,
          detail: med?.dose,
          note: log.notes,
        });
      }
    });
    customFactorLogs.forEach((log) => {
      const t = toDate(log.timestamp);
      if (t >= start && t <= end) {
        const f = customFactors.find((cf) => cf.id === log.factorId);
        if (!f) return;
        const display = f.scale === 'yesno' ? (log.value ? 'yes' : 'no') : `${log.value}${f.unit ? ` ${f.unit}` : ''}`;
        items.push({
          id: log.id,
          kind: 'context',
          timestamp: t,
          title: `${f.label}: ${display}`,
          note: log.notes,
        });
      }
    });
    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [foodLogs, symptoms, today, medicationLogs, medications, customFactorLogs, customFactors]);

  const counts = useMemo(() => ({
    food: todayItems.filter((i) => i.kind === 'food').length,
    symptom: todayItems.filter((i) => i.kind === 'symptom').length,
  }), [todayItems]);

  // Consecutive days (today backwards) with at least one food or symptom log.
  const streak = useMemo(() => {
    const logged = new Set<string>();
    const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    foodLogs.forEach((l) => logged.add(key(toDate(l.timestamp))));
    symptoms.forEach((s) => logged.add(key(toDate(s.timestamp))));
    let count = 0;
    const now = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      if (logged.has(key(d))) count++;
      else break;
    }
    return count;
  }, [foodLogs, symptoms]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { foods: [] as FoodLog[], symptoms: [] as Symptom[], experiments: [] as typeof experiments };
    const q = searchQuery.toLowerCase();
    return {
      foods: foodLogs.filter((l) => l.food.toLowerCase().includes(q) || l.tags.some((t) => t.toLowerCase().includes(q)) || l.notes?.toLowerCase().includes(q)).slice(0, 10),
      symptoms: symptoms.filter((s) => s.type.toLowerCase().includes(q) || s.notes?.toLowerCase().includes(q)).slice(0, 10),
      experiments: experiments.filter((e) => e.name.toLowerCase().includes(q) || e.notes?.toLowerCase().includes(q)).slice(0, 10),
    };
  }, [searchQuery, foodLogs, symptoms, experiments]);

  const fastingInfo = useMemo(() => {
    if (!fastingSettings.enabled) return null;
    const lastMeal = fastingSettings.lastMealTime ? toDate(fastingSettings.lastMealTime) : (foodLogs[0] ? toDate(foodLogs[0].timestamp) : null);
    if (!lastMeal) return null;
    const hoursSince = (Date.now() - lastMeal.getTime()) / 3.6e6;
    const isFasting = hoursSince < fastingSettings.fastingWindow;
    if (isFasting) {
      const remaining = fastingSettings.fastingWindow - hoursSince;
      const hoursIn = Math.min(fastingSettings.fastingWindow, hoursSince);
      return { mode: 'fasting' as const, remaining, hoursIn, pct: hoursIn / fastingSettings.fastingWindow };
    }
    const eatEnd = new Date(lastMeal.getTime() + (fastingSettings.fastingWindow + fastingSettings.eatingWindow) * 3.6e6);
    const remaining = (eatEnd.getTime() - Date.now()) / 3.6e6;
    if (remaining <= 0) return null;
    return { mode: 'eating' as const, remaining };
  }, [fastingSettings, foodLogs]);

  const dateLine = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateSub = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <>
      <div className="w-full max-w-2xl mx-auto">
        <PageHeader
          eyebrow={dateSub}
          title={dateLine}
          subtitle={t('home.meals_symptoms', { food: counts.food, sym: counts.symptom })}
          action={
            <button
              aria-label={t('common.search')}
              onClick={() => setShowSearchResults((v) => !v)}
              className="pill"
              style={{ padding: '6px 8px' }}
            >
              <IconSearch size={15} />
            </button>
          }
        />

        {showWelcomeBanner && (
          <div className="mx-5 mb-4 card p-4 relative">
            <button
              onClick={handleDismissWelcome}
              aria-label={t('common.close')}
              className="absolute top-2.5 right-2.5 muted hover:text-ink"
            >
              ✕
            </button>
            <div className="pr-6">
              <div className="eyebrow mb-1">{t('home.welcome_title')}</div>
              <p className="text-[13.5px] ink-soft leading-relaxed">
                {t('home.welcome_body')}
              </p>
            </div>
          </div>
        )}

        {showClearDemoButton && (
          <div
            className="mx-5 mb-4 px-4 py-3 rounded-card flex items-center justify-between gap-3"
            style={{ background: 'var(--surface-alt)', border: '1px dashed var(--border-strong)' }}
          >
            <div>
              <div className="eyebrow mb-0.5">{t('home.demo_label')}</div>
              <p className="text-[12.5px] ink-soft">{t('home.demo_body')}</p>
            </div>
            <button
              onClick={handleClearDemoData}
              className="pill pill-strong text-xs"
            >
              {t('common.clear')}
            </button>
          </div>
        )}

        {showSearchResults && (
          <div className="mx-5 mb-4 card p-3">
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('home.search_placeholder')}
              className="w-full bg-transparent border-0 outline-none text-[14px] ink font-body"
            />
            {searchQuery.trim() && (
              <div className="mt-3 space-y-2 text-[13px] ink-soft">
                {searchResults.foods.length > 0 && (
                  <div>
                    <div className="eyebrow mb-1">Foods · {searchResults.foods.length}</div>
                    {searchResults.foods.map((l) => (
                      <div key={l.id} className="py-1">{l.food}{l.tags.length ? ` · ${l.tags.join(', ')}` : ''}</div>
                    ))}
                  </div>
                )}
                {searchResults.symptoms.length > 0 && (
                  <div>
                    <div className="eyebrow mb-1">Symptoms · {searchResults.symptoms.length}</div>
                    {searchResults.symptoms.map((s) => (
                      <div key={s.id} className="py-1">{s.type} · {s.severity}/10</div>
                    ))}
                  </div>
                )}
                {searchResults.experiments.length > 0 && (
                  <div>
                    <div className="eyebrow mb-1">Experiments · {searchResults.experiments.length}</div>
                    {searchResults.experiments.map((e) => (
                      <div key={e.id} className="py-1">{e.name}{e.active ? ' · active' : ''}</div>
                    ))}
                  </div>
                )}
                <Link href={`/chat?query=${encodeURIComponent(searchQuery)}`} className="block mt-3 text-[12.5px] text-accent">
                  Ask the diary about &quot;{searchQuery}&quot; →
                </Link>
              </div>
            )}
          </div>
        )}

        {fastingInfo && (
          <div className="mx-5 mb-4 card flex items-center gap-3 px-3.5 py-2.5">
            <div className="relative w-8 h-8">
              <svg width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="13" fill="none" stroke="var(--border)" strokeWidth="2.5" />
                <circle
                  cx="16" cy="16" r="13" fill="none" stroke="var(--accent)" strokeWidth="2.5"
                  strokeDasharray={`${(fastingInfo.mode === 'fasting' ? fastingInfo.pct : 1) * 81.7} 999`}
                  transform="rotate(-90 16 16)" strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] ink-soft font-medium">
                {fastingInfo.mode === 'fasting' ? `Fasting, ${Math.floor(fastingInfo.hoursIn)}h in` : 'Eating window open'}
              </div>
              <div className="text-[11.5px] muted font-mono">
                {fastingInfo.mode === 'fasting'
                  ? `${fastingInfo.remaining.toFixed(1)}h until you can break`
                  : `${fastingInfo.remaining.toFixed(1)}h remaining`}
              </div>
            </div>
          </div>
        )}

        {(smartTip || smartTipLoading) && (
          <div className="mx-5 mb-4">
            <AIAnnotation label={t('home.smart_label')}>
              {smartTipLoading && !smartTip ? <span className="muted">{t('home.thinking')}</span> : smartTip}
            </AIAnnotation>
          </div>
        )}

        <div className="mx-5 mb-3 grid grid-cols-3 gap-2">
          <ActionButton
            primary
            label={t('home.btn_food')}
            icon={<IconBowl size={18} />}
            onClick={() => setShowFoodModal(true)}
          />
          <ActionButton
            label={t('home.btn_symptom')}
            icon={<IconPulse size={18} />}
            onClick={() => setShowSymptomModal(true)}
          />
          <ActionButton
            label={t('home.btn_context')}
            icon={<IconMoon size={18} />}
            onClick={() => setShowContextModal(true)}
          />
        </div>

        {streak > 0 && (
          <div className="mx-5 mt-1 mb-2 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium"
              style={{ background: streak >= 7 ? '#5a8a3c22' : 'var(--surface-alt)', color: streak >= 7 ? '#5a8a3c' : 'var(--ink-soft)', border: '1px solid var(--border)' }}
            >
              {streak === 1 ? t('home.streak_today') : t('home.streak', { n: streak })}
            </span>
          </div>
        )}

        <QuickFactors />

        <div className="h-3" />

        <section className="px-5 pb-10">
          <div className="flex items-baseline justify-between mb-1.5">
            <h2 className="m-0 font-heading text-[17px] font-semibold tracking-head ink">{t('home.stream')}</h2>
            <span className="eyebrow">{t('home.newest')}</span>
          </div>
          {todayItems.length === 0 ? (
            <p className="muted text-[13px] py-3">{t('home.empty')}</p>
          ) : (
            todayItems.map((it, i, arr) => (
              <TimelineRow key={it.id} item={it} prev={i > 0} next={i < arr.length - 1} />
            ))
          )}
        </section>
      </div>

      <LogFoodModal isOpen={showFoodModal} onClose={() => setShowFoodModal(false)} />
      <LogSymptomModal isOpen={showSymptomModal} onClose={() => setShowSymptomModal(false)} />
      <LogContextModal isOpen={showContextModal} onClose={() => setShowContextModal(false)} />
    </>
  );
}

function ActionButton({
  label,
  icon,
  primary,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1.5 px-2 py-3 transition-colors"
      style={
        primary
          ? {
              background: 'var(--ink)',
              color: 'var(--bg)',
              border: '1px solid transparent',
              borderRadius: 14,
            }
          : {
              background: 'transparent',
              color: 'var(--ink)',
              border: '1px solid var(--border-strong)',
              borderRadius: 14,
            }
      }
    >
      {icon}
      <span className="text-[12.5px] font-medium">{label}</span>
    </button>
  );
}

function QuickFactors() {
  const medications = useAppStore((s) => s.medications);
  const customFactors = useAppStore((s) => s.customFactors);
  const addMedicationLog = useAppStore((s) => s.addMedicationLog);
  const addCustomFactorLog = useAppStore((s) => s.addCustomFactorLog);

  const activeMeds = medications.filter((m) => m.active);
  const activeFactors = customFactors.filter((f) => f.active);
  const items: Array<{ key: string; label: string; sub?: string; onClick: () => void }> = [];

  activeMeds.forEach((m) => {
    items.push({
      key: `med-${m.id}`,
      label: `💊 ${m.name}`,
      sub: m.dose,
      onClick: () => addMedicationLog({ medicationId: m.id }),
    });
  });
  activeFactors.forEach((f) => {
    if (f.scale === 'yesno') {
      items.push({
        key: `f-${f.id}-yes`,
        label: `${f.label}: yes`,
        onClick: () => addCustomFactorLog({ factorId: f.id, value: 1 }),
      });
    } else if (f.scale === 'severity') {
      // 3 quick-tap buckets: low (3) / med (6) / high (9)
      items.push({
        key: `f-${f.id}-low`,
        label: f.label,
        sub: 'low (3)',
        onClick: () => addCustomFactorLog({ factorId: f.id, value: 3 }),
      });
      items.push({
        key: `f-${f.id}-med`,
        label: f.label,
        sub: 'med (6)',
        onClick: () => addCustomFactorLog({ factorId: f.id, value: 6 }),
      });
      items.push({
        key: `f-${f.id}-hi`,
        label: f.label,
        sub: 'high (9)',
        onClick: () => addCustomFactorLog({ factorId: f.id, value: 9 }),
      });
    }
  });

  if (items.length === 0) return null;

  return (
    <div className="mx-5 mb-3 -mt-1 flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
      {items.map((it) => (
        <button
          key={it.key}
          onClick={it.onClick}
          className="flex-shrink-0 px-3 py-2 rounded-card text-left transition-colors"
          style={{
            background: 'var(--surface-alt)',
            border: '1px solid var(--border)',
            color: 'var(--ink)',
            minWidth: 80,
          }}
        >
          <div className="text-[12.5px] font-medium leading-tight truncate" style={{ maxWidth: 140 }}>
            {it.label}
          </div>
          {it.sub && <div className="text-[10.5px] muted font-mono mt-0.5">{it.sub}</div>}
        </button>
      ))}
    </div>
  );
}
