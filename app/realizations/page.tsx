'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { formatDate, formatTime } from '@/lib/utils';
import { Realization } from '@/types';

export default function RealizationsPage() {
  const realizations = useAppStore((state) => state.realizations);
  const addRealization = useAppStore((state) => state.addRealization);
  const deleteRealization = useAppStore((state) => state.deleteRealization);
  const [showAddModal, setShowAddModal] = useState(false);
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    addRealization({
      content: content.trim(),
    });

    setContent('');
    setShowAddModal(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">My Realizations</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary-500 hover:bg-primary-600 text-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add Realization
        </button>
      </div>

      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          Write down your personal observations and realizations. These help you and the AI understand your patterns better.
        </p>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Add Realization</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Your Realization *</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="E.g., 'Bloating seems worse after high-fiber meals.'"
                    rows={6}
                    autoFocus
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setContent('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                    disabled={!content.trim()}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {realizations.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            No realizations yet. Add your first observation or insight.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {realizations.map((realization) => (
            <div
              key={realization.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {realization.content}
                  </p>
                </div>
                <button
                  onClick={() => deleteRealization(realization.id)}
                  className="ml-4 text-red-500 hover:text-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {formatDate(realization.timestamp)} at {formatTime(realization.timestamp)}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Add Realization</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Your Realization</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Write your observation, insight, or realization..."
                    rows={6}
                    autoFocus
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setContent('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                    disabled={!content.trim()}
                  >
                    Save
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

