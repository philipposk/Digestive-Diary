'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { SeverityLevel, Symptom } from '@/types';
import { useVoiceCapture } from '@/lib/hooks/useVoiceCapture';
import { rankSuspectFoods } from '@/lib/suspectFoods';
import { generateInsights } from '@/lib/generateInsights';
import { IconCamera, IconClose, IconMic, IconSpark } from '@/components/ui/Icon';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const symptomTypes = [
  'bloating', 'pain', 'nausea', 'gas', 'constipation', 'diarrhea', 'heartburn',
  'hypoglycemia', 'low energy', 'low concentration', 'cramps', 'intestinal pinching',
  'inflammation', 'rash', 'pimple', 'skin irritation', 'sugar craving', 'other',
];

const toDate = (v: Date | string) => (v instanceof Date ? v : new Date(v));
const fmtTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const fmtShortDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export default function LogSymptomModal({ isOpen, onClose }: Props) {
  const [type, setType] = useState('');
  const [customType, setCustomType] = useState('');
  const [severity, setSeverity] = useState<SeverityLevel>(5);
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [linkedFoodId, setLinkedFoodId] = useState('');
  const [linkedSymptomId, setLinkedSymptomId] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const addSymptom = useAppStore((s) => s.addSymptom);
  const foodLogs = useAppStore((s) => s.foodLogs);
  const symptoms = useAppStore((s) => s.symptoms);
  const experiments = useAppStore((s) => s.experiments);
  const voice = useVoiceCapture();

  const effectiveType = type === 'other' ? customType.trim() : type;

  const recentFoodLogs = useMemo(
    () => foodLogs
      .filter((f) => (Date.now() - toDate(f.timestamp).getTime()) / 3.6e6 <= 24)
      .slice(0, 10)
      .sort((a, b) => toDate(b.timestamp).getTime() - toDate(a.timestamp).getTime()),
    [foodLogs]
  );

  const previousSymptoms = useMemo(
    () => symptoms
      .filter((s) => (!effectiveType || effectiveType === 'other' ? true : s.type === effectiveType))
      .filter((s) => (Date.now() - toDate(s.timestamp).getTime()) / 86_400_000 <= 30)
      .slice(0, 10)
      .sort((a, b) => toDate(b.timestamp).getTime() - toDate(a.timestamp).getTime()),
    [symptoms, effectiveType]
  );

  const suspectFoods = useMemo(() => {
    if (!effectiveType) return [];
    const recent48h = foodLogs.filter((f) =>
      (Date.now() - toDate(f.timestamp).getTime()) / 3.6e6 <= 48
    );
    if (recent48h.length === 0) return [];
    const insights = generateInsights(foodLogs, symptoms, experiments);
    return rankSuspectFoods(effectiveType, recent48h, insights, symptoms);
  }, [effectiveType, foodLogs, symptoms, experiments]);

  useEffect(() => {
    if (!isOpen) {
      setType(''); setCustomType(''); setSeverity(5); setDuration(''); setNotes('');
      setLinkedFoodId(''); setLinkedSymptomId('');
      setPhotoUrl(''); setPhotoFile(null); setAiAnalysis(null); setAnalyzing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVoice = async () => {
    if (voice.recording) {
      const transcript = await voice.stop();
      if (!transcript) return;
      setNotes((prev) => (prev.trim() ? `${prev.trim()}\n${transcript}` : transcript));
      if (!type) {
        const lower = transcript.toLowerCase();
        const matched = symptomTypes.find((s) => s !== 'other' && lower.includes(s.toLowerCase()));
        if (matched) setType(matched);
      }
    } else {
      await voice.start();
    }
  };

  const handlePhoto = async (file: File) => {
    setPhotoFile(file);
    const r = new FileReader();
    r.onload = (e) => setPhotoUrl((e.target?.result as string) || '');
    r.readAsDataURL(file);
  };

  const analyzePhoto = async () => {
    if (!photoFile) return;
    setAnalyzing(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve((r.result as string).split(',')[1]);
        r.onerror = reject;
        r.readAsDataURL(photoFile);
      });
      const recent = foodLogs
        .filter((f) => (Date.now() - toDate(f.timestamp).getTime()) / 3.6e6 <= 48)
        .slice(0, 20);
      const res = await fetch('/api/openai/analyze-symptom-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, userData: { foodLogs: recent } }),
      });
      if (res.ok) setAiAnalysis(await res.json());
    } catch (err) {
      console.error(err);
      alert('Photo analysis failed. Try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const symptomType = effectiveType;
    if (!symptomType) return;
    const next: Omit<Symptom, 'id' | 'timestamp'> = {
      type: symptomType,
      severity,
      duration: duration.trim() || undefined,
      notes: notes.trim() || undefined,
      linkedFoodId: linkedFoodId || undefined,
      linkedSymptomId: linkedSymptomId || undefined,
      photoUrl: photoUrl || undefined,
      aiAnalysis: aiAnalysis
        ? {
            description: aiAnalysis.description,
            suggestion: aiAnalysis.suggestion,
            possibleCauses: aiAnalysis.possibleCauses || [],
            analysisTimestamp: new Date(),
          }
        : undefined,
    };
    addSymptom(next);
    onClose();
  };

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
            <h2 className="m-0 font-heading text-[22px] tracking-head ink">Log symptom</h2>
            <button onClick={onClose} className="muted hover:text-ink" aria-label="Close">
              <IconClose size={18} />
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <div className="eyebrow mb-1.5">Type</div>
              <div className="flex flex-wrap gap-1.5">
                {symptomTypes.map((s) => {
                  const on = type === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setType(s)}
                      className="px-3 py-1.5 rounded-full text-[12px] capitalize"
                      style={{
                        background: on ? 'var(--ink)' : 'transparent',
                        color: on ? 'var(--bg)' : 'var(--ink-soft)',
                        border: `1px solid ${on ? 'var(--ink)' : 'var(--border)'}`,
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              {type === 'other' && (
                <input
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  placeholder="Enter custom symptom"
                  className="mt-2 w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
                  style={{ border: '1px solid var(--border)' }}
                  autoFocus
                />
              )}
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <div className="eyebrow">Severity</div>
                <span className="font-mono text-[11px] muted">{severity}/10</span>
              </div>
              <input
                type="range" min={1} max={10}
                value={severity}
                onChange={(e) => setSeverity(Number(e.target.value) as SeverityLevel)}
                className="w-full accent-current"
                style={{ accentColor: 'var(--accent)' }}
              />
              <div className="flex justify-between text-[10px] muted mt-0.5">
                <span>mild</span><span>severe</span>
              </div>
            </div>

            <label className="block">
              <span className="eyebrow">Duration</span>
              <input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 30 min, 2 h"
                className="mt-1.5 w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
                style={{ border: '1px solid var(--border)' }}
              />
            </label>

            {suspectFoods.length > 0 && (
              <div
                className="p-3 rounded-card"
                style={{ background: 'var(--surface-alt)', border: '1px dashed var(--border-strong)' }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className="w-[18px] h-[18px] rounded-md flex items-center justify-center"
                    style={{ background: 'var(--accent)', color: 'var(--surface)' }}
                  >
                    <IconSpark size={11} stroke={2.2} />
                  </div>
                  <div className="eyebrow">Likely culprits</div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {suspectFoods.map((c) => {
                    const on = linkedFoodId === c.foodLogId;
                    return (
                      <button
                        key={c.foodLogId}
                        type="button"
                        onClick={() => setLinkedFoodId(on ? '' : c.foodLogId)}
                        title={c.reasons.join(' · ')}
                        className="text-left px-2.5 py-1 rounded-card text-[11.5px]"
                        style={{
                          background: on ? 'var(--accent)' : 'var(--surface)',
                          color: on ? 'var(--surface)' : 'var(--ink-soft)',
                          border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                        }}
                      >
                        <div className="font-medium">{c.food}</div>
                        <div className="opacity-75 font-mono text-[10px]">
                          {c.hoursAgo.toFixed(1)}h ago · {Math.round(c.score)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <label className="block">
              <span className="eyebrow">Link to food (optional)</span>
              <select
                value={linkedFoodId}
                onChange={(e) => setLinkedFoodId(e.target.value)}
                className="mt-1.5 w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
                style={{ border: '1px solid var(--border)' }}
              >
                <option value="">None</option>
                {recentFoodLogs.map((f) => (
                  <option key={f.id} value={f.id}>
                    {fmtTime(toDate(f.timestamp))} — {f.food}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="eyebrow">Link to previous {effectiveType || 'symptom'} (optional)</span>
              <select
                value={linkedSymptomId}
                onChange={(e) => setLinkedSymptomId(e.target.value)}
                className="mt-1.5 w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
                style={{ border: '1px solid var(--border)' }}
              >
                <option value="">None — new occurrence</option>
                {previousSymptoms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {fmtShortDate(toDate(p.timestamp))} — {p.type} (S{p.severity})
                  </option>
                ))}
              </select>
            </label>

            <div>
              <div className="eyebrow mb-1.5">Photo (for visible symptoms)</div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]; if (f) handlePhoto(f);
                }}
              />
              {!photoUrl ? (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-card text-[13px] ink-soft"
                  style={{ border: '2px dashed var(--border-strong)' }}
                >
                  <IconCamera size={15} /> Take or upload photo
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoUrl} alt="" className="w-full rounded-card max-h-48 object-cover" />
                    <button
                      type="button"
                      onClick={() => { setPhotoUrl(''); setPhotoFile(null); setAiAnalysis(null); }}
                      className="absolute top-2 right-2 px-2 py-1 rounded-full text-white"
                      style={{ background: 'rgba(0,0,0,0.55)' }}
                    >
                      ✕
                    </button>
                  </div>
                  {!aiAnalysis && (
                    <button
                      type="button"
                      onClick={analyzePhoto}
                      disabled={analyzing}
                      className="w-full px-3 py-2 rounded-full text-[12.5px] disabled:opacity-50"
                      style={{ background: 'var(--ink)', color: 'var(--bg)' }}
                    >
                      {analyzing ? 'Analyzing…' : 'Analyze with AI'}
                    </button>
                  )}
                  {aiAnalysis && (
                    <div className="card p-3 text-[12.5px] ink-soft space-y-1.5">
                      {aiAnalysis.description && <p className="m-0"><b className="ink">Description:</b> {aiAnalysis.description}</p>}
                      {aiAnalysis.suggestion && <p className="m-0"><b className="ink">Suggestion:</b> {aiAnalysis.suggestion}</p>}
                      {Array.isArray(aiAnalysis.possibleCauses) && aiAnalysis.possibleCauses.length > 0 && (
                        <ul className="list-disc list-inside m-0 space-y-0.5">
                          {aiAnalysis.possibleCauses.map((c: string, i: number) => <li key={i}>{c}</li>)}
                        </ul>
                      )}
                      {aiAnalysis.disclaimer && <p className="m-0 italic text-[11.5px] muted">{aiAnalysis.disclaimer}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="eyebrow mb-1.5">Notes</div>
              <div className="flex gap-2 items-start">
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What does it feel like? Where?"
                  className="flex-1 px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
                  style={{ border: '1px solid var(--border)' }}
                />
                {voice.supported && (
                  <button
                    type="button"
                    onClick={handleVoice}
                    disabled={voice.transcribing}
                    aria-label={voice.recording ? 'Stop' : 'Dictate'}
                    className="px-2.5 py-2 rounded-full disabled:opacity-50"
                    style={{
                      background: voice.recording ? '#ef4444' : 'transparent',
                      color: voice.recording ? '#fff' : 'var(--ink-soft)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <IconMic size={13} />
                  </button>
                )}
              </div>
              {voice.error && <p className="mt-1 text-[11px]" style={{ color: '#c44' }}>{voice.error}</p>}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-full text-[13px]"
                style={{ border: '1px solid var(--border-strong)', color: 'var(--ink-soft)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!effectiveType || analyzing}
                className="flex-1 px-4 py-2.5 rounded-full text-[14px] font-medium disabled:opacity-50"
                style={{ background: 'var(--ink)', color: 'var(--bg)' }}
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
