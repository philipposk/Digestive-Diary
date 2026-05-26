'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Recipe } from '@/types';
import { generateSampleRecipes } from '@/lib/generateRecipes';
import PageHeader from '@/components/ui/PageHeader';
import Tag from '@/components/ui/Tag';
import { IconSearch, IconUpRight } from '@/components/ui/Icon';
import { useT } from '@/lib/i18n';
import Link from 'next/link';

export default function RecipesPage() {
  const { t } = useT();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const recipes = useAppStore((s) => s.recipes);
  const setRecipes = useAppStore((s) => s.setRecipes);
  const recipeSourcesSettings = useAppStore((s) => s.recipeSourcesSettings);
  const experiments = useAppStore((s) => s.experiments);
  const foodLogs = useAppStore((s) => s.foodLogs);

  useEffect(() => {
    const stale = recipes.length > 0 && recipes.some(
      (r) => r.sourceName === 'Sample Recipe Collection'
        || (Array.isArray(r.ingredients) && r.ingredients.some((i) => typeof i === 'string' && i.startsWith('Main ingredient')))
    );
    if (recipes.length === 0 || stale) {
      const curated = generateSampleRecipes();
      const keep = recipes.filter(
        (r) => r.sourceName !== 'Sample Recipe Collection'
          && !(Array.isArray(r.ingredients) && r.ingredients.some((i) => typeof i === 'string' && i.startsWith('Main ingredient')))
      );
      setRecipes([...curated, ...keep]);
    }
  }, [recipes, setRecipes]);

  const commonTags = useMemo(() => {
    const counts = new Map<string, number>();
    foodLogs.forEach((l) => l.tags.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);
  }, [foodLogs]);

  const allRecipeTags = useMemo(() => {
    const set = new Set<string>();
    recipes.forEach((r) => r.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [recipes]);

  const activeExperiments = useMemo(() => {
    const patterns: Array<{ re: RegExp; produce: (m: RegExpMatchArray) => string[] }> = [
      { re: /no\s+([a-z][a-z\-]+)/i, produce: (m) => [m[1].toLowerCase()] },
      { re: /avoid\s+([a-z][a-z\-]+)/i, produce: (m) => [m[1].toLowerCase()] },
      { re: /low[-\s]?fodmap/i, produce: () => ['high-fodmap', 'onion', 'garlic'] },
      { re: /dairy[-\s]?free/i, produce: () => ['dairy'] },
      { re: /gluten[-\s]?free/i, produce: () => ['gluten'] },
      { re: /vegan/i, produce: () => ['meat', 'dairy', 'egg'] },
    ];
    return experiments
      .filter((e) => e.active)
      .map((e) => {
        const lower = e.name.toLowerCase();
        const restrictions = new Set<string>();
        for (const { re, produce } of patterns) {
          const m = lower.match(re);
          if (m) produce(m).forEach((r) => restrictions.add(r));
        }
        return { name: lower, restrictions: Array.from(restrictions) };
      });
  }, [experiments]);

  const allRestrictions = useMemo(
    () => Array.from(new Set(activeExperiments.flatMap((e) => e.restrictions))),
    [activeExperiments]
  );

  const filteredRecipes = useMemo(() => {
    let filtered = recipes.filter((r) => {
      if (allRestrictions.length > 0) {
        const haystack = [r.name, ...(r.tags || [])].join(' ').toLowerCase();
        for (const x of allRestrictions) if (x && haystack.includes(x)) return false;
      }
      if (r.sourceUrl) {
        const url = r.sourceUrl;
        const enabled = recipeSourcesSettings.sources.some((s) => {
          if (!s.enabled) return false;
          try {
            return new URL(url).hostname === new URL(s.url).hostname || url.startsWith(s.url);
          } catch {
            return url.startsWith(s.url);
          }
        });
        if (!enabled) return false;
      }
      if (selectedTag) return r.tags.includes(selectedTag);
      return true;
    });
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter((r) =>
        r.name.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [recipes, selectedTag, query, recipeSourcesSettings, allRestrictions]);

  const handleSearch = async () => {
    if (!query.trim() && commonTags.length === 0 && activeExperiments.length === 0) {
      setSearchError(t('recipes.search_empty_error'));
      return;
    }
    setSearchError(null);
    setIsLoading(true);
    try {
      const ctx: string[] = [];
      if (activeExperiments.length) ctx.push(`Restrictions: ${activeExperiments.map((e) => e.name).join(', ')}`);
      if (commonTags.length) ctx.push(`Common tags: ${commonTags.join(', ')}`);
      const res = await fetch('/api/openai/recipe-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim() || 'healthy recipes',
          context: ctx.join('. '),
          dietaryRestrictions: allRestrictions,
          preferredTags: commonTags,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const ai: Recipe[] = (data.recipes || []).map((r: any, i: number) => ({
        id: `ai-recipe-${Date.now()}-${i}`,
        name: r.name,
        description: r.description,
        ingredients: r.ingredients || [],
        instructions: r.instructions || [],
        tags: r.tags || [],
        estimatedMacros: r.estimatedMacros,
        sourceName: 'AI',
        sourceUrl: undefined,
      }));
      setRecipes([...recipes, ...ai]);
    } catch {
      setSearchError(t('recipes.search_error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <PageHeader
        eyebrow={t('recipes.eyebrow')}
        title={t('recipes.title')}
        subtitle={t('recipes.subtitle')}
      />

      <div className="mx-5 mb-4">
        <div className="card p-2 flex items-center gap-2">
          <IconSearch size={15} className="muted" style={{ marginLeft: 6, color: 'var(--muted)' }} />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedTag(null); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={t('recipes.search_placeholder')}
            className="flex-1 bg-transparent border-0 outline-none text-[14px] ink py-1"
          />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-full text-[12.5px] inline-flex items-center gap-1.5 disabled:opacity-50"
            style={{ background: 'var(--ink)', color: 'var(--bg)' }}
          >
            {isLoading ? t('recipes.searching') : <>{t('recipes.ask_ai')} <IconUpRight size={12} /></>}
          </button>
        </div>
      </div>

      {searchError && (
        <p className="mx-5 mb-3 text-[12.5px]" style={{ color: '#c44a4a' }}>{searchError}</p>
      )}

      {activeExperiments.length > 0 && (
        <div className="mx-5 mb-4 card p-3 text-[12.5px] ink-soft">
          <div className="eyebrow mb-0.5">{t('recipes.active_experiments_label')}</div>
          {t('recipes.active_experiments_body', { names: activeExperiments.map((e) => e.name).join(', ') })}
        </div>
      )}

      {allRecipeTags.length > 0 && (
        <div className="mx-5 mb-4">
          <div className="eyebrow mb-1.5">{t('recipes.filter_by_tag')}</div>
          <div className="flex flex-wrap gap-1.5">
            {allRecipeTags.map((t) => {
              const on = selectedTag === t;
              return (
                <button
                  key={t}
                  onClick={() => { setSelectedTag(on ? null : t); setQuery(''); }}
                  className="px-2.5 py-1 rounded-full text-[11.5px] capitalize"
                  style={{
                    background: on ? 'var(--ink)' : 'transparent',
                    color: on ? 'var(--bg)' : 'var(--ink-soft)',
                    border: `1px solid ${on ? 'var(--ink)' : 'var(--border)'}`,
                  }}
                >
                  {t}
                </button>
              );
            })}
            {selectedTag && (
              <button onClick={() => setSelectedTag(null)} className="text-[12px] text-accent ml-1">
                {t('common.clear')}
              </button>
            )}
          </div>
        </div>
      )}

      <section className="px-5 pb-10">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="m-0 font-heading text-[17px] tracking-head ink">{t('recipes.title')}</h2>
          <span className="eyebrow">{filteredRecipes.length} {t('common.found')}</span>
        </div>

        {filteredRecipes.length === 0 ? (
          <div className="card p-4 muted text-[13.5px]">
            {t('recipes.no_results')}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredRecipes.map((r) => {
              const open = expanded === r.id;
              return (
                <article key={r.id} className="card overflow-hidden">
                  <button
                    onClick={() => setExpanded(open ? null : r.id)}
                    className="w-full text-left px-4 py-3.5"
                  >
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-[15px] font-medium ink">{r.name}</span>
                      {r.sourceName && <span className="eyebrow">{r.sourceName}</span>}
                    </div>
                    {r.description && (
                      <p className="m-0 text-[12.5px] muted line-clamp-2">{r.description}</p>
                    )}
                    {r.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {r.tags.slice(0, 6).map((t) => <Tag key={t}>{t}</Tag>)}
                      </div>
                    )}
                  </button>
                  {open && (
                    <div className="px-4 pb-4 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                      {r.estimatedMacros && (
                        <div className="mt-3 mb-2 grid grid-cols-4 gap-2 text-[12.5px] ink-soft">
                          <div><span className="muted">kcal</span> {r.estimatedMacros.calories}</div>
                          <div><span className="muted">P</span> {r.estimatedMacros.protein}g</div>
                          <div><span className="muted">C</span> {r.estimatedMacros.carbs}g</div>
                          <div><span className="muted">F</span> {r.estimatedMacros.fat}g</div>
                        </div>
                      )}
                      {r.ingredients.length > 0 && (
                        <div className="mt-3">
                          <div className="eyebrow mb-1.5">{t('recipes.ingredients')}</div>
                          <ul className="list-disc list-inside text-[13px] ink-soft space-y-0.5">
                            {r.ingredients.map((i, k) => <li key={k}>{i}</li>)}
                          </ul>
                        </div>
                      )}
                      {r.instructions.length > 0 && (
                        <div className="mt-3">
                          <div className="eyebrow mb-1.5">{t('recipes.steps')}</div>
                          <ol className="list-decimal list-inside text-[13px] ink-soft space-y-1">
                            {r.instructions.map((s, k) => <li key={k}>{s}</li>)}
                          </ol>
                        </div>
                      )}
                      {r.sourceUrl && (
                        <a
                          href={r.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-3 text-[12px] text-accent hover:underline truncate max-w-full"
                        >
                          {r.sourceUrl}
                        </a>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-6 card p-4">
          <div className="eyebrow mb-1">{t('recipes.ask_diary_label')}</div>
          <p className="m-0 text-[13px] ink-soft mb-2">
            {t('recipes.ask_diary_body')}
          </p>
          <Link
            href="/chat?query=Suggest recipes for me based on what I've been eating and active experiments."
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px]"
            style={{ background: 'var(--ink)', color: 'var(--bg)' }}
          >
            {t('recipes.open_chat')} <IconUpRight size={12} />
          </Link>
        </div>
      </section>
    </div>
  );
}
