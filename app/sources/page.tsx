'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Source, SourceType } from '@/types';
import { formatDate } from '@/lib/utils';

export default function SourcesPage() {
  const { sources, addSource, deleteSource, updateSource } = useAppStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<SourceType>('book');
  const [url, setUrl] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  const handleAdd = () => {
    setEditingSource(null);
    setTitle('');
    setType('book');
    setUrl('');
    setAuthor('');
    setDescription('');
    setContent('');
    setTags('');
    setShowAddModal(true);
  };

  const handleEdit = (source: Source) => {
    setEditingSource(source);
    setTitle(source.title);
    setType(source.type);
    setUrl(source.url || '');
    setAuthor(source.author || '');
    setDescription(source.description || '');
    setContent(source.content || '');
    setTags(source.tags?.join(', ') || '');
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const sourceData = {
      title: title.trim(),
      type,
      url: url.trim() || undefined,
      author: author.trim() || undefined,
      description: description.trim() || undefined,
      content: content.trim() || undefined,
      tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
    };

    if (editingSource) {
      updateSource(editingSource.id, sourceData);
    } else {
      addSource(sourceData);
    }

    setShowAddModal(false);
    setEditingSource(null);
    setTitle('');
    setType('book');
    setUrl('');
    setAuthor('');
    setDescription('');
    setContent('');
    setTags('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this source?')) {
      deleteSource(id);
    }
  };

  const sourceTypeLabels: Record<SourceType, string> = {
    book: '📚 Book',
    article: '📄 Article',
    video: '🎥 Video',
    pdf: '📑 PDF',
    other: '📋 Other',
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Knowledge Sources</h1>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          + Add Source
        </button>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Add books, articles, videos, or PDFs that you want the AI to reference when answering questions.
      </p>

      {sources.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="mb-4">No sources added yet.</p>
          <p className="text-sm">Add sources to help the AI provide more informed answers.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sources.map((source) => (
            <div
              key={source.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{sourceTypeLabels[source.type][0]}</span>
                    <h3 className="font-semibold text-lg">{source.title}</h3>
                  </div>
                  {source.author && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      by {source.author}
                    </p>
                  )}
                  {source.description && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {source.description}
                    </p>
                  )}
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      {source.url}
                    </a>
                  )}
                  {source.tags && source.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {source.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Added {formatDate(source.addedAt)}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(source)}
                    className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(source.id)}
                    className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-4">
                {editingSource ? 'Edit Source' : 'Add Source'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="e.g., The Mind-Gut Connection"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Type *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as SourceType)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="book">📚 Book</option>
                    <option value="article">📄 Article</option>
                    <option value="video">🎥 Video</option>
                    <option value="pdf">📑 PDF</option>
                    <option value="other">📋 Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Author</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Author name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">URL (for videos/articles)</label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Brief description..."
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Content/Notes (for AI reference)
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Key points, excerpts, or notes from this source..."
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This content will be available to the AI when answering questions
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="digestive health, nutrition, gut"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingSource(null);
                      setTitle('');
                      setType('book');
                      setUrl('');
                      setAuthor('');
                      setDescription('');
                      setContent('');
                      setTags('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                  >
                    {editingSource ? 'Update' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

