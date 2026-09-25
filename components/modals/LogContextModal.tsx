'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { SleepQuality, StressLevel, ActivityLevel, BowelType, BristolType, CyclePhase, FlowLevel } from '@/types';
import { IconClose } from '@/components/ui/Icon';
import BristolPicker from '@/components/ui/BristolPicker';
import { useT } from '@/lib/i18n';
import { useModalA11y } from '@/lib/hooks/useModalA11y';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editId?: string | null;
}

function ChipRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T | undefined;
  onChange: (v: T | undefined) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value === o;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(on ? undefined : o)}
            className="px-3 py-1 rounded-full text-[12px] capitalize"
            style={{
              background: on ? 'var(--ink)' : 'transparent',
              color: on ? 'var(--bg)' : 'var(--ink-soft)',
              border: `1px solid ${on ? 'var(--ink)' : 'var(--border)'}`,
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export default function LogContextModal({ isOpen, onClose, editId = null }: Props) {
  const { t } = useT();
  const { overlayProps } = useModalA11y(isOpen, onClose, 'log-context-title');
  const [sleepQuality, setSleepQuality] = useState<SleepQuality | undefined>();
  const [sleepDuration, setSleepDuration] = useState<number | undefined>();
  const [sleepStart, setSleepStart] = useState('');
  const [sleepEnd, setSleepEnd] = useState('');
  const [stressLevel, setStressLevel] = useState<StressLevel | undefined>();
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | undefined>();
  const [bowelMovement, setBowelMovement] = useState<boolean | undefined>();
  const [bowelType, setBowelType] = useState<BowelType | undefined>();
  const [bristolType, setBristolType] = useState<BristolType | undefined>();
  const [cyclePhase, setCyclePhase] = useState<CyclePhase | undefined>();
  const [cycleFlow, setCycleFlow] = useState<FlowLevel | undefined>();
  const [hydrationMl, setHydrationMl] = useState<number | undefined>();
  const [notes, setNotes] = useState('');

  const addContext = useAppStore((s) => s.addContext);
  const updateContext = useAppStore((s) => s.updateContext);
  const contexts = useAppStore((s) => s.contexts);

  const toTimeInput = (d?: Date | string) => {
    if (!d) return '';
    const date = d instanceof Date ? d : new Date(d);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!isOpen) {
      setSleepQuality(undefined); setSleepDuration(undefined);
      setSleepStart(''); setSleepEnd('');
      setStressLevel(undefined); setActivityLevel(undefined);
      setBowelMovement(undefined); setBowelType(undefined);
      setBristolType(undefined); setCyclePhase(undefined); setCycleFlow(undefined);
      setHydrationMl(undefined); setNotes('');
      return;
    }
    if (editId) {
      const ctx = contexts.find((c) => c.id === editId);
      if (ctx) {
        setSleepQuality(ctx.sleepQuality);
        setSleepDuration(ctx.sleepDuration);
        setSleepStart(toTimeInput(ctx.sleepStartTime));
        setSleepEnd(toTimeInput(ctx.sleepEndTime));
        setStressLevel(ctx.stressLevel);
        setActivityLevel(ctx.activityLevel);
        setBowelMovement(ctx.bowelMovement);
        setBowelType(ctx.bowelType);
        setBristolType(ctx.bristolType);
        setCyclePhase(ctx.cyclePhase);
        setCycleFlow(ctx.cycleFlow);
        setHydrationMl(ctx.hydrationMl);
        setNotes(ctx.notes ?? '');
      }
    }
  }, [isOpen, editId, contexts]);

  if (!isOpen) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    let startDate: Date | undefined;
    let endDate: Date | undefined;
    if (sleepStart) {
      startDate = new Date();
      const [h, m] = sleepStart.split(':').map(Number);
      startDate.setHours(h, m, 0, 0);
      if (h >= 18) startDate.setDate(startDate.getDate() - 1);
    }
    if (sleepEnd) {
      endDate = new Date();
      const [h, m] = sleepEnd.split(':').map(Number);
      endDate.setHours(h, m, 0, 0);
    }

    const payload = {
      sleepQuality,
      sleepDuration,
      sleepStartTime: startDate,
      sleepEndTime: endDate,
      stressLevel,
      activityLevel,
      bowelMovement,
      bowelType,
      bristolType,
      cyclePhase,
      cycleFlow,
      hydrationMl,
      notes: notes.trim() || undefined,
    };
    if (editId) {
      updateContext(editId, payload);
    } else {
      addContext(payload);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
      {...overlayProps}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md max-h-[92dvh] flex flex-col bg-app"
        style={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderTop: '1px solid var(--border)',
          boxShadow: '0 -16px 40px rgba(0,0,0,0.18)',
        }}
      >
        <form onSubmit={submit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="px-5 pt-2.5 pb-4">
          <div className="mx-auto w-10 h-1 rounded-full mb-3" style={{ background: 'var(--border-strong)' }} />
          <div className="flex items-baseline justify-between mb-3">
            <h2 id="log-context-title" className="m-0 font-heading text-[22px] tracking-head ink">{t('log_context.title')}</h2>
            <button type="button" onClick={onClose} className="muted hover:text-ink" aria-label="Close">
              <IconClose size={18} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="eyebrow mb-1.5">{t('log_context.sleep_quality')}</div>
              <ChipRow<SleepQuality>
                options={['poor', 'ok', 'good']}
                value={sleepQuality}
                onChange={setSleepQuality}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <label className="block">
                <span className="eyebrow">{t('log_context.duration_h')}</span>
                <input
                  type="number" min={0} max={24} step={0.5}
                  value={sleepDuration ?? ''}
                  onChange={(e) => setSleepDuration(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g. 7.5"
                  className="mt-1.5 w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
                  style={{ border: '1px solid var(--border)' }}
                />
              </label>
              <label className="block">
                <span className="eyebrow">{t('log_context.start')}</span>
                <input
                  type="time"
                  value={sleepStart}
                  onChange={(e) => setSleepStart(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
                  style={{ border: '1px solid var(--border)' }}
                />
              </label>
              <label className="block">
                <span className="eyebrow">{t('log_context.wake')}</span>
                <input
                  type="time"
                  value={sleepEnd}
                  onChange={(e) => setSleepEnd(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
                  style={{ border: '1px solid var(--border)' }}
                />
              </label>
            </div>

            <div>
              <div className="eyebrow mb-1.5">{t('log_context.stress')}</div>
              <ChipRow<StressLevel>
                options={['low', 'medium', 'high']}
                value={stressLevel}
                onChange={setStressLevel}
              />
            </div>

            <div>
              <div className="eyebrow mb-1.5">{t('log_context.activity')}</div>
              <ChipRow<ActivityLevel>
                options={['none', 'light', 'intense']}
                value={activityLevel}
                onChange={setActivityLevel}
              />
            </div>

            <div>
              <div className="eyebrow mb-1.5">{t('log_context.bowel')}</div>
              <div className="flex gap-2">
                {(['yes', 'no'] as const).map((v) => {
                  const isYes = v === 'yes';
                  const on = bowelMovement === isYes;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setBowelMovement(on ? undefined : isYes)}
                      className="flex-1 px-3 py-2 rounded-card text-[13px] capitalize"
                      style={{
                        background: on ? 'var(--ink)' : 'transparent',
                        color: on ? 'var(--bg)' : 'var(--ink-soft)',
                        border: `1px solid ${on ? 'var(--ink)' : 'var(--border)'}`,
                      }}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>

            {bowelMovement === true && (
              <>
                <div>
                  <div className="eyebrow mb-1.5">{t('log_context.bristol')}</div>
                  <BristolPicker value={bristolType} onChange={setBristolType} />
                </div>
                <div>
                  <div className="eyebrow mb-1.5">{t('log_context.quality')}</div>
                  <ChipRow<BowelType>
                    options={['normal', 'loose', 'hard', 'none']}
                    value={bowelType}
                    onChange={setBowelType}
                  />
                </div>
              </>
            )}

            <div>
              <div className="eyebrow mb-1.5">{t('log_context.cycle')}</div>
              <ChipRow<CyclePhase>
                options={['menses', 'follicular', 'ovulation', 'luteal']}
                value={cyclePhase}
                onChange={setCyclePhase}
              />
            </div>

            {cyclePhase === 'menses' && (
              <div>
                <div className="eyebrow mb-1.5">{t('log_context.flow')}</div>
                <ChipRow<FlowLevel>
                  options={['spotting', 'light', 'medium', 'heavy']}
                  value={cycleFlow}
                  onChange={setCycleFlow}
                />
              </div>
            )}

            <label className="block">
              <span className="eyebrow">{t('log_context.hydration')}</span>
              <input
                type="number" min={0} max={6000} step={50}
                value={hydrationMl ?? ''}
                onChange={(e) => setHydrationMl(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="e.g. 1500"
                className="mt-1.5 w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
                style={{ border: '1px solid var(--border)' }}
              />
            </label>

            <label className="block">
              <span className="eyebrow">{t('common.notes')}</span>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything to remember?"
                className="mt-1.5 w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
                style={{ border: '1px solid var(--border)' }}
              />
            </label>
          </div>
            </div>
          </div>

          <div
            className="flex-shrink-0 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex gap-2"
            style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full text-[13px]"
              style={{ border: '1px solid var(--border-strong)', color: 'var(--ink-soft)' }}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-full text-[14px] font-medium"
              style={{ background: 'var(--ink)', color: 'var(--bg)' }}
            >
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
