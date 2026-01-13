'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { generateInsights } from '@/lib/generateInsights';

export default function InsightsPage() {
  const foodLogs = useAppStore((state) => state.foodLogs);
  const symptoms = useAppStore((state) => state.symptoms);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  const insights = useMemo(() => {
    return generateInsights(foodLogs, symptoms);
  }, [foodLogs, symptoms]);

  // Extract categories separately
  useEffect(() => {
    const uniqueCategories = Array.from(
      new Set(insights.map((insight) => insight.category || 'uncategorized').filter(Boolean))
    ).filter((cat) => cat !== 'uncategorized') as string[];
    setCategories(uniqueCategories);
  }, [insights]);

  // Filter insights by category
  const filteredInsights = useMemo(() => {
    if (selectedCategory === 'all') {
      return insights;
    }
    return insights.filter((insight) => (insight.category || 'uncategorized') === selectedCategory);
  }, [insights, selectedCategory]);

  const getConfidenceColor = (confidence: 'low' | 'medium' | 'high') => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700';
      case 'low':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Insights</h1>
      
      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedCategory === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedCategory === category
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}
      
      {filteredInsights.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            No insights available yet. Insights are generated automatically as you log more data.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Need at least 2 occurrences of a symptom linked to foods to generate insights.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInsights.map((insight) => (
            <div
              key={insight.id}
              className={`rounded-lg p-4 border ${getConfidenceColor(insight.confidence)}`}
            >
              <div className="flex justify-between items-start mb-2">
                <p className="font-medium flex-1">{insight.description}</p>
                <span className="ml-2 px-2 py-1 text-xs rounded bg-white dark:bg-gray-800 bg-opacity-50 dark:bg-opacity-50">
                  {insight.confidence}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs opacity-75">
                  Based on {insight.dataPoints} data point{insight.dataPoints !== 1 ? 's' : ''}
                </div>
                {insight.category && (
                  <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                    {insight.category}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-xs text-yellow-800 dark:text-yellow-200">
          <strong>Note:</strong> These insights are patterns detected in your data only. They are not medical advice.
          Always consult with a healthcare professional for medical concerns.
        </p>
      </div>
    </div>
  );
}
