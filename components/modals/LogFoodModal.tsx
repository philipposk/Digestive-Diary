'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useVoiceCapture } from '@/lib/hooks/useVoiceCapture';
import Tag from '@/components/ui/Tag';
import { IconCamera, IconClose, IconMic, IconSpark } from '@/components/ui/Icon';
import { useT } from '@/lib/i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const commonTags = ['dairy', 'gluten', 'spicy', 'raw', 'processed', 'fiber-rich', 'fatty', 'alcohol', 'sugar'];

interface ParsedItem {
  name: string;
  quantity?: string;
  tags: string[];
}

export default function LogFoodModal({ isOpen, onClose }: Props) {
  const { t } = useT();
  const [food, setFood] = useState('');
  const [quantity, setQuantity] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [macros, setMacros] = useState<{ calories?: number; protein?: number; carbs?: number; fat?: number; fiber?: number } | null>(null);
  const [portionWeight, setPortionWeight] = useState<number | undefined>(undefined);
  const [parsed, setParsed] = useState<ParsedItem[] | null>(null);
  const [parseMs, setParseMs] = useState<number | null>(null);
  const [parsing, setParsing] = useState(false);

  const addFoodLog = useAppStore((s) => s.addFoodLog);
  const voice = useVoiceCapture();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setFood(''); setQuantity(''); setSelectedTags([]); setNotes('');
      setImagePreview(null); setMacros(null); setPortionWeight(undefined);
      setParsed(null); setParseMs(null); setAnalyzing(false); setParsing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleTag = (t: string) =>
    setSelectedTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const parseFood = async (text: string) => {
    if (!text.trim()) return;
    setParsing(true);
    const t0 = Date.now();
    try {
      const res = await fetch('/api/openai/parse-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const foods: ParsedItem[] = Array.isArray(data?.foods) ? data.foods.map((f: any) => ({
        name: String(f?.name ?? '').trim(),
        quantity: f?.quantity ? String(f.quantity) : undefined,
        tags: Array.isArray(f?.tags) ? f.tags.filter((x: any) => typeof x === 'string') : [],
      })).filter((f: ParsedItem) => f.name) : [];
      if (foods.length > 0) {
        setParsed(foods);
        setParseMs(Date.now() - t0);
        if (foods[0]?.name) setFood((cur) => cur || foods[0].name);
        if (foods[0]?.quantity) setQuantity((cur) => cur || foods[0].quantity || '');
        const tagPool = Array.from(new Set([
          ...foods.flatMap((f) => f.tags),
          ...(Array.isArray(data?.suggested_tags) ? data.suggested_tags : []),
        ].map((t: any) => String(t).toLowerCase())));
        const matched = tagPool.filter((t) => commonTags.includes(t));
        if (matched.length > 0) setSelectedTags((prev) => Array.from(new Set([...prev, ...matched])));
      }
    } catch {
      // silent
    } finally {
      setParsing(false);
    }
  };

  const handleVoiceClick = async () => {
    if (voice.recording) {
      const transcript = await voice.stop();
      if (!transcript) return;
      setFood(transcript);
      await parseFood(transcript);
    } else {
      await voice.start();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please pick an image.'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    setAnalyzing(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onloadend = () => resolve((r.result as string).split(',')[1]);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const res = await fetch('/api/openai/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.food) setFood(data.food);
        if (data.quantity) setQuantity(data.quantity);
        if (Array.isArray(data.tags)) {
          setSelectedTags(data.tags.filter((t: string) => commonTags.includes(t.toLowerCase())));
        }
        if (data.notes) setNotes(data.notes);
        if (data.macros) setMacros(data.macros);
      }
      // macro estimation pass
      const mres = await fetch('/api/openai/analyze-food-macros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, foodName: food, quantity }),
      });
      if (mres.ok) {
        const md = await mres.json();
        if (md.portionWeight || md.calories) {
          setMacros({
            calories: md.calories || 0,
            protein: md.protein || 0,
            carbs: md.carbs || 0,
            fat: md.fat || 0,
            fiber: md.fiber || 0,
          });
          setPortionWeight(md.portionWeight || undefined);
        }
      }
    } catch {
      alert('Image analysis failed. Enter food manually.');
    } finally {
      setAnalyzing(false);
    }
  };

  const removeParsed = (idx: number) => setParsed((p) => p && p.filter((_, i) => i !== idx));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsed && parsed.length > 0) {
      parsed.forEach((p) => {
        addFoodLog({
          food: p.name,
          quantity: p.quantity,
          tags: p.tags.length > 0 ? p.tags : selectedTags,
          notes: notes.trim() || undefined,
        });
      });
    } else {
      if (!food.trim()) return;
      addFoodLog({
        food: food.trim(),
        quantity: quantity.trim() || undefined,
        tags: selectedTags,
        notes: notes.trim() || undefined,
        macros: macros || undefined,
        portionWeight,
      });
    }
    onClose();
  };

  const saveLabel = parsed && parsed.length > 0
    ? t('log_food.save_n', { n: parsed.length, s: parsed.length === 1 ? '' : 's' })
    : t('common.save');

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-app"
        style={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderTop: '1px solid var(--border)',
          boxShadow: '0 -16px 40px rgba(0,0,0,0.18)',
        }}
      >
        <div className="px-5 pt-2.5 pb-6">
          <div className="mx-auto w-10 h-1 rounded-full mb-3" style={{ background: 'var(--border-strong)' }} />

          <div className="flex items-baseline justify-between mb-3">
            <h2 className="m-0 font-heading text-[22px] tracking-head ink">{t('log_food.title')}</h2>
            <button onClick={onClose} aria-label={t('common.close')} className="muted hover:text-ink">
              <IconClose size={18} />
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3.5">
            <div className="card p-3.5 min-h-[100px] relative">
              <textarea
                value={food}
                onChange={(e) => setFood(e.target.value)}
                onBlur={() => food.trim() && parseFood(food.trim())}
                placeholder={t('log_food.placeholder')}
                rows={3}
                className="w-full bg-transparent border-0 outline-none text-[15px] ink resize-none"
                autoFocus
              />
              <div className="absolute right-3 bottom-3 flex gap-1.5">
                {voice.supported && (
                  <button
                    type="button"
                    onClick={handleVoiceClick}
                    aria-label={voice.recording ? 'Stop' : 'Dictate'}
                    className="px-2 py-1 rounded-full"
                    style={{
                      border: '1px solid var(--border)',
                      color: voice.recording ? '#fff' : 'var(--ink-soft)',
                      background: voice.recording ? '#ef4444' : 'transparent',
                    }}
                  >
                    <IconMic size={13} />
                  </button>
                )}
                <label
                  className="px-2 py-1 rounded-full cursor-pointer"
                  style={{ border: '1px solid var(--border)', color: 'var(--ink-soft)' }}
                  title="Photo"
                >
                  <IconCamera size={13} />
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={analyzing}
                  />
                </label>
              </div>
            </div>

            {(parsing || parsed) && (
              <div
                className="px-3 py-2.5 rounded-card flex items-center gap-2.5"
                style={{ background: 'var(--surface-alt)', border: '1px dashed var(--border-strong)' }}
              >
                <div
                  className="w-[18px] h-[18px] rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--ink)', color: 'var(--bg)' }}
                >
                  <IconSpark size={11} stroke={2} />
                </div>
                <div className="flex-1 text-[12.5px] ink-soft">
                  {parsing
                    ? t('log_food.parsing')
                    : t('log_food.parsed_n', { n: parsed!.length, s: parsed!.length === 1 ? '' : 's' })}
                </div>
                {parseMs !== null && (
                  <span className="font-mono text-[10px] muted">{parseMs}ms</span>
                )}
              </div>
            )}

            {parsed && parsed.length > 0 && (
              <div className="space-y-1.5">
                {parsed.map((it, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-card"
                    style={{ border: '1px solid var(--border)' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] ink truncate">{it.name}</div>
                      {it.tags.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {it.tags.map((t) => <Tag key={t}>{t}</Tag>)}
                        </div>
                      )}
                    </div>
                    {it.quantity && <span className="font-mono text-[12px] muted">{it.quantity}</span>}
                    <button
                      type="button"
                      onClick={() => removeParsed(i)}
                      className="muted hover:text-ink"
                      aria-label="Remove"
                    >
                      <IconClose size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {imagePreview && (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="" className="w-full rounded-card max-h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className="absolute top-2 right-2 px-2 py-1 rounded-full text-white"
                  style={{ background: 'rgba(0,0,0,0.55)' }}
                >
                  ✕
                </button>
              </div>
            )}
            {analyzing && <p className="text-[11.5px] muted">{t('log_food.analyzing')}</p>}

            {!parsed && (
              <div>
                <div className="eyebrow mb-1.5">{t('log_food.quantity', { optional: t('common.optional') })}</div>
                <input
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder={t('log_food.quantity_placeholder')}
                  className="w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
                  style={{ border: '1px solid var(--border)' }}
                />
              </div>
            )}

            <div>
              <div className="eyebrow mb-1.5">{t('log_food.tags')}</div>
              <div className="flex flex-wrap gap-1.5">
                {commonTags.map((t) => {
                  const on = selectedTags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      className="px-2.5 py-1 rounded-full text-[12px] capitalize"
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
              </div>
            </div>

            <div>
              <div className="eyebrow mb-1.5">{t('log_food.notes', { optional: t('common.optional') })}</div>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('log_food.notes_placeholder')}
                className="w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
                style={{ border: '1px solid var(--border)' }}
              />
            </div>

            {macros && (
              <div className="card p-3">
                <div className="eyebrow mb-1.5">{t('recipes.macros')}</div>
                <div className="grid grid-cols-4 gap-2 text-[12.5px] ink-soft">
                  <div><span className="muted">kcal</span> {macros.calories ?? '—'}</div>
                  <div><span className="muted">P</span> {macros.protein ?? '—'}g</div>
                  <div><span className="muted">C</span> {macros.carbs ?? '—'}g</div>
                  <div><span className="muted">F</span> {macros.fat ?? '—'}g</div>
                </div>
                {portionWeight && (
                  <div className="mt-1.5 font-mono text-[11px] muted">{portionWeight}g portion</div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 rounded-full text-[13px]"
                style={{ border: '1px solid var(--border-strong)', color: 'var(--ink-soft)' }}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={!food.trim() && (!parsed || parsed.length === 0)}
                className="flex-1 px-4 py-3 rounded-full text-[14px] font-medium disabled:opacity-50"
                style={{ background: 'var(--ink)', color: 'var(--bg)' }}
              >
                {saveLabel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
