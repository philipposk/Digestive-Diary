'use client';

import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface Props {
  items: FAQItem[];
}

export default function FAQ({ items }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.question} className="card overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : i)}
              className="w-full text-left px-4 py-3 flex justify-between gap-3 btn-ghost hover:bg-surf-alt transition-colors"
              aria-expanded={open}
            >
              <span className="text-[14px] font-medium ink">{item.question}</span>
              <span className="muted text-[18px] leading-none">{open ? '−' : '+'}</span>
            </button>
            {open && (
              <div className="px-4 pb-3 text-[13px] ink-soft border-t border-app">
                <p className="m-0 pt-2">{item.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
