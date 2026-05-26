'use client';

import { useAppStore } from '@/lib/store';
import PageHeader from '@/components/ui/PageHeader';
import { Dot } from '@/components/ui/Icon';
import { useT } from '@/lib/i18n';

const toDate = (v: Date | string) => (v instanceof Date ? v : new Date(v));

const TYPE_LABEL: Record<string, string> = {
  recipe_source_error: 'Recipe source error',
  api_error: 'API error',
  other: 'Notification',
};

export default function AdminPage() {
  const { t } = useT();
  const notifs = useAppStore((s) => s.adminNotifications);
  const resolveOne = useAppStore((s) => s.resolveAdminNotification);
  const clearAll = useAppStore((s) => s.clearAdminNotifications);

  const open = notifs.filter((n) => !n.resolved);
  const done = notifs.filter((n) => n.resolved);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <PageHeader
        eyebrow={t('admin.eyebrow')}
        title={t('admin.title')}
        subtitle={t('admin.subtitle')}
      />

      <section className="px-5 pb-10">
        {notifs.length === 0 ? (
          <div className="card p-4 muted text-[13.5px]">
            {t('admin.empty')}
          </div>
        ) : (
          <>
            {open.length > 0 && (
              <div className="mb-5">
                <div className="flex items-baseline justify-between mb-2">
                  <h2 className="m-0 font-heading text-[17px] tracking-head ink">{t('admin.active_n', { n: open.length })}</h2>
                  <button
                    onClick={() => {
                      if (confirm(t('admin.resolve_all') + '?')) open.forEach((n) => resolveOne(n.id));
                    }}
                    className="text-[12px] text-accent hover:underline"
                  >
                    {t('admin.resolve_all')}
                  </button>
                </div>
                <div className="space-y-2">
                  {open.map((n) => (
                    <article key={n.id} className="card p-3.5">
                      <div className="flex items-baseline gap-2 mb-1">
                        <Dot size={6} color="var(--accent)" />
                        <span className="eyebrow">{TYPE_LABEL[n.type] ?? n.type}</span>
                        <span className="font-mono text-[11px] muted ml-auto">
                          {toDate(n.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="m-0 text-[13.5px] ink-soft">{n.message}</p>
                      {n.details && (
                        <details className="mt-2">
                          <summary className="text-[12px] muted cursor-pointer">{t('admin.show_details')}</summary>
                          <pre
                            className="mt-1 p-2 rounded-card text-[11px] overflow-auto max-h-40 font-mono"
                            style={{ background: 'var(--surface-alt)' }}
                          >
{JSON.stringify(n.details, null, 2)}
                          </pre>
                        </details>
                      )}
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => resolveOne(n.id)}
                          className="px-3 py-1 rounded-full text-[12px]"
                          style={{ background: 'var(--ink)', color: 'var(--bg)' }}
                        >
                          {t('admin.resolve')}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {done.length > 0 && (
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <h2 className="m-0 font-heading text-[16px] tracking-head muted">{t('admin.resolved_n', { n: done.length })}</h2>
                  <button
                    onClick={() => {
                      if (confirm(t('admin.clear_all') + '?')) clearAll();
                    }}
                    className="text-[12px] text-accent hover:underline"
                  >
                    {t('admin.clear_all')}
                  </button>
                </div>
                <div className="space-y-2 opacity-65">
                  {done.slice(0, 12).map((n) => (
                    <div
                      key={n.id}
                      className="card p-3 flex items-baseline gap-2"
                    >
                      <span className="eyebrow">{TYPE_LABEL[n.type] ?? n.type}</span>
                      <span className="text-[13px] ink-soft flex-1 min-w-0 truncate">{n.message}</span>
                      <span className="font-mono text-[11px] muted">
                        {toDate(n.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
