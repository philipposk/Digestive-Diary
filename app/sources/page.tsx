'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Source, SourceType } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import Tag from '@/components/ui/Tag';
import { IconBook, IconClose, IconPlus, IconTrash } from '@/components/ui/Icon';
import { useT } from '@/lib/i18n';

const toDate = (v: Date | string) => (v instanceof Date ? v : new Date(v));

export default function SourcesPage() {
  const { t } = useT();
  const TYPE_LABEL: Record<SourceType, string> = {
    book: t('sources.type_book'),
    article: t('sources.type_article'),
    video: t('sources.type_video'),
    pdf: t('sources.type_pdf'),
    other: t('sources.type_other'),
  };
  const sources = useAppStore((s) => s.sources);
  const addSource = useAppStore((s) => s.addSource);
  const deleteSource = useAppStore((s) => s.deleteSource);
  const updateSource = useAppStore((s) => s.updateSource);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Source | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<SourceType>('book');
  const [url, setUrl] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  const resetForm = () => {
    setEditing(null); setTitle(''); setType('book'); setUrl(''); setAuthor('');
    setDescription(''); setContent(''); setTags('');
  };

  const openNew = () => { resetForm(); setOpen(true); };
  const openEdit = (s: Source) => {
    setEditing(s);
    setTitle(s.title); setType(s.type); setUrl(s.url ?? ''); setAuthor(s.author ?? '');
    setDescription(s.description ?? ''); setContent(s.content ?? ''); setTags((s.tags ?? []).join(', '));
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const data = {
      title: title.trim(),
      type,
      url: url.trim() || undefined,
      author: author.trim() || undefined,
      description: description.trim() || undefined,
      content: content.trim() || undefined,
      tags: tags.trim() ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
    };
    if (editing) updateSource(editing.id, data); else addSource(data);
    setOpen(false); resetForm();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <PageHeader
        eyebrow={t('sources.eyebrow')}
        title={t('sources.title')}
        subtitle={t('sources.subtitle')}
        action={
          <button
            onClick={openNew}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px]"
            style={{ background: 'var(--ink)', color: 'var(--bg)' }}
          >
            <IconPlus size={13} /> {t('common.add')}
          </button>
        }
      />

      <section className="px-5 pb-10">
        {sources.length === 0 ? (
          <div className="card p-4 muted text-[13.5px]">
            {t('sources.empty')}
          </div>
        ) : (
          <div className="space-y-2">
            {sources.map((s) => (
              <article key={s.id} className="card p-3.5">
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-card flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--surface-alt)', color: 'var(--ink-soft)' }}
                  >
                    <IconBook size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-[15px] font-medium ink truncate">{s.title}</span>
                      <span className="eyebrow">{TYPE_LABEL[s.type]}</span>
                    </div>
                    {s.author && <div className="text-[12.5px] muted mt-0.5">by {s.author}</div>}
                    {s.description && <p className="text-[13px] ink-soft mt-1.5 m-0">{s.description}</p>}
                    {s.url && (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mt-1.5 text-[12px] text-accent truncate hover:underline"
                      >
                        {s.url}
                      </a>
                    )}
                    {s.tags && s.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {s.tags.map((t) => <Tag key={t}>{t}</Tag>)}
                      </div>
                    )}
                    <div className="eyebrow mt-2">{t('sources.added', { date: toDate(s.addedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) })}</div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => openEdit(s)}
                      className="text-[12px] muted hover:text-ink"
                    >
                      {t('common.edit')}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this source?')) deleteSource(s.id);
                      }}
                      aria-label="Delete"
                      className="muted hover:text-ink"
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => { setOpen(false); resetForm(); }}
        >
          <div
            className="card w-full max-w-md max-h-[88vh] overflow-y-auto p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="m-0 font-heading text-[22px] tracking-head ink">
                {editing ? t('sources.edit_title') : t('sources.add_title')}
              </h2>
              <button onClick={() => { setOpen(false); resetForm(); }} className="muted hover:text-ink" aria-label={t('common.close')}>
                <IconClose size={18} />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <label className="block">
                <span className="eyebrow">{t('sources.field_title')}</span>
                <input
                  autoFocus required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="The Mind-Gut Connection"
                  className="mt-1 w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
                  style={{ border: '1px solid var(--border)' }}
                />
              </label>
              <label className="block">
                <span className="eyebrow">{t('sources.field_type')}</span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as SourceType)}
                  className="mt-1 w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
                  style={{ border: '1px solid var(--border)' }}
                >
                  {(['book', 'article', 'video', 'pdf', 'other'] as SourceType[]).map((t) => (
                    <option key={t} value={t}>{TYPE_LABEL[t]}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="eyebrow">{t('sources.field_author')}</span>
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
                  style={{ border: '1px solid var(--border)' }}
                />
              </label>
              <label className="block">
                <span className="eyebrow">{t('sources.field_url')}</span>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://…"
                  className="mt-1 w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
                  style={{ border: '1px solid var(--border)' }}
                />
              </label>
              <label className="block">
                <span className="eyebrow">{t('sources.field_description')}</span>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
                  style={{ border: '1px solid var(--border)' }}
                />
              </label>
              <label className="block">
                <span className="eyebrow">{t('sources.field_content')}</span>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
                  style={{ border: '1px solid var(--border)' }}
                />
              </label>
              <label className="block">
                <span className="eyebrow">{t('sources.field_tags')}</span>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="digestive health, nutrition"
                  className="mt-1 w-full px-3 py-2 rounded-card text-[14px] ink bg-app outline-none"
                  style={{ border: '1px solid var(--border)' }}
                />
              </label>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setOpen(false); resetForm(); }}
                  className="px-4 py-2 rounded-full text-[13px]"
                  style={{ border: '1px solid var(--border-strong)', color: 'var(--ink-soft)' }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-full text-[13px]"
                  style={{ background: 'var(--ink)', color: 'var(--bg)' }}
                >
                  {editing ? t('common.update') : t('common.add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
