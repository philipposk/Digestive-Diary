import * as React from 'react';
import Severity from './Severity';
import Tag from './Tag';
import { IconLink } from './Icon';

export type TimelineKind = 'food' | 'symptom' | 'context';

export interface TimelineItem {
  id: string;
  kind: TimelineKind;
  timestamp: Date;
  title: string;
  detail?: string;
  tags?: string[];
  severity?: number;
  duration?: string;
  note?: string;
  linkedFoodTitle?: string;
  photoUrl?: string;
}

interface Props {
  item: TimelineItem;
  prev?: boolean;
  next?: boolean;
}

const fmt = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export default function TimelineRow({ item, prev, next }: Props) {
  const isSymptom = item.kind === 'symptom';
  return (
    <div className="flex gap-3.5 py-2.5 relative">
      <div className="w-14 flex-shrink-0 text-right pt-1">
        <span className="font-mono text-[11.5px] muted tracking-mono">{fmt(item.timestamp)}</span>
      </div>
      <div className="relative w-3.5 flex-shrink-0">
        {prev && <span className="absolute top-0 bottom-1/2 w-px" style={{ left: 6, background: 'var(--border)' }} />}
        {next && <span className="absolute top-1/2 bottom-0 w-px" style={{ left: 6, background: 'var(--border)' }} />}
        <span
          className="absolute top-2 left-px rounded-full"
          style={{
            width: 11,
            height: 11,
            background: isSymptom ? 'var(--accent)' : 'var(--bg)',
            border: `1.5px solid ${isSymptom ? 'var(--accent)' : 'var(--border-strong)'}`,
          }}
        />
      </div>
      <div className="flex-1 pt-px pb-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[15px] font-medium ink truncate">{item.title}</span>
          {isSymptom && item.duration && (
            <span className="text-xs muted font-mono">· {item.duration}</span>
          )}
        </div>
        {item.detail && <div className="text-[13px] muted mt-0.5">{item.detail}</div>}
        {isSymptom && typeof item.severity === 'number' && (
          <div className="mt-1.5">
            <Severity value={item.severity} />
          </div>
        )}
        {!isSymptom && item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {item.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        )}
        {item.linkedFoodTitle && (
          <div
            className="mt-2 inline-flex items-center gap-1.5 px-2 py-[3px] rounded-full muted text-[11.5px]"
            style={{ border: '1px dashed var(--border-strong)' }}
          >
            <IconLink size={11} />
            <span>
              after <span className="font-medium ink-soft">{item.linkedFoodTitle}</span>
            </span>
          </div>
        )}
        {item.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.photoUrl}
            alt={`${item.title} photo`}
            className="mt-2 rounded-card max-h-40 object-cover border border-app"
          />
        )}
        {item.note && (
          <div
            className="mt-1.5 text-[12.5px] italic ink-soft pl-2"
            style={{ borderLeft: '2px solid var(--border-strong)' }}
          >
            {item.note}
          </div>
        )}
      </div>
    </div>
  );
}
