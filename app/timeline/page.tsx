'use client';

import { useState, useMemo } from 'react';
import { formatTime, formatDate } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { FoodLog, Symptom } from '@/types';

type SortOrder = 'newest' | 'oldest';
type ViewStyle = 'list' | 'compact';

export default function TimelinePage() {
  const [filter, setFilter] = useState<'all' | 'food' | 'symptom'>('all');
  const [dateRange, setDateRange] = useState<'7d' | '14d' | '30d'>('14d');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [viewStyle, setViewStyle] = useState<ViewStyle>('list');

  const foodLogs = useAppStore((state) => state.foodLogs);
  const symptoms = useAppStore((state) => state.symptoms);

  const filteredItems = useMemo(() => {
    const now = new Date();
    const daysAgo = dateRange === '7d' ? 7 : dateRange === '14d' ? 14 : 30;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysAgo);
    startDate.setHours(0, 0, 0, 0);

    const items: Array<{ type: 'food' | 'symptom'; data: FoodLog | Symptom; timestamp: Date; linkedFood?: FoodLog }> = [];

    if (filter === 'all' || filter === 'food') {
      foodLogs.forEach((log) => {
        if (log.timestamp >= startDate) {
          items.push({ type: 'food', data: log, timestamp: log.timestamp });
        }
      });
    }

    if (filter === 'all' || filter === 'symptom') {
      symptoms.forEach((symptom) => {
        if (symptom.timestamp >= startDate) {
          const linkedFood = symptom.linkedFoodId 
            ? foodLogs.find((f) => f.id === symptom.linkedFoodId)
            : undefined;
          items.push({ type: 'symptom', data: symptom, timestamp: symptom.timestamp, linkedFood });
        }
      });
    }

    // Sort by timestamp
    items.sort((a, b) => {
      return sortOrder === 'newest' 
        ? b.timestamp.getTime() - a.timestamp.getTime()
        : a.timestamp.getTime() - b.timestamp.getTime();
    });

    return items;
  }, [foodLogs, symptoms, filter, dateRange, sortOrder]);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Timeline</h1>
      
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Filter by type</label>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('food')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'food'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Food
            </button>
            <button
              onClick={() => setFilter('symptom')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'symptom'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Symptoms
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Time range</label>
            <div className="flex gap-2 flex-wrap">
              {(['7d', '14d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    dateRange === range
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {range === '7d' ? '7d' : range === '14d' ? '14d' : '30d'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Sort order</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSortOrder('newest')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  sortOrder === 'newest'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Newest
              </button>
              <button
                onClick={() => setSortOrder('oldest')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  sortOrder === 'oldest'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Oldest
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No entries found for the selected filters.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const itemDate = formatDate(item.timestamp);
            const prevItem = filteredItems[filteredItems.indexOf(item) - 1];
            const showDate = !prevItem || formatDate(prevItem.timestamp) !== itemDate;

            return (
              <div key={item.data.id}>
                {showDate && (
                  <div className="sticky top-0 bg-white dark:bg-gray-950 py-2 z-10 border-b border-gray-200 dark:border-gray-800 mb-2">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {itemDate}
                    </h3>
                  </div>
                )}
                <div
                  className={`rounded-lg p-4 mb-2 ${
                    item.type === 'food'
                      ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700'
                      : 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-lg">
                        {item.type === 'food' ? '🍽️' : '🏥'}
                      </span>
                      <div className="flex-1">
                        <span className="font-medium">
                          {item.type === 'food' 
                            ? (item.data as FoodLog).food
                            : (item.data as Symptom).type
                          }
                        </span>
                        {item.type === 'symptom' && item.linkedFood && (
                          <div className="text-xs text-red-700 dark:text-red-300 mt-1">
                            ← After: {item.linkedFood.food} ({formatTime(item.linkedFood.timestamp)})
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                      {formatTime(item.timestamp)}
                    </span>
                  </div>
                  {item.type === 'food' && (item.data as FoodLog).quantity && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {(item.data as FoodLog).quantity}
                    </p>
                  )}
                  {item.type === 'food' && (item.data as FoodLog).tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(item.data as FoodLog).tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 bg-blue-300 dark:bg-blue-700 text-blue-900 dark:text-blue-100 rounded font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {item.type === 'symptom' && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Severity: {(item.data as Symptom).severity}/10
                      </span>
                      {(item.data as Symptom).duration && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          • {(item.data as Symptom).duration}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
