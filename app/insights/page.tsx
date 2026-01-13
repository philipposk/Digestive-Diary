'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { generateInsights } from '@/lib/generateInsights';
import { Pattern } from '@/types';

export default function InsightsPage() {
  const foodLogs = useAppStore((state) => state.foodLogs);
  const symptoms = useAppStore((state) => state.symptoms);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedInsight, setSelectedInsight] = useState<Pattern | null>(null);

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
              onClick={() => setSelectedInsight(insight)}
              className={`rounded-lg p-4 border ${getConfidenceColor(insight.confidence)} cursor-pointer hover:shadow-md transition-shadow`}
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
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                Click to see details →
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

      {/* Insight Detail Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-semibold">Insight Details</h2>
                <button
                  onClick={() => setSelectedInsight(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Description */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Description</h3>
                  <p className="text-base font-medium">{selectedInsight.description}</p>
                </div>

                {/* Pattern Details */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Pattern Analysis</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Symptom Type</p>
                      <p className="text-sm font-medium">{selectedInsight.pattern.symptom}</p>
                    </div>
                    
                    {selectedInsight.pattern.followsFood && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Follows Food</p>
                        <p className="text-sm font-medium capitalize">{selectedInsight.pattern.followsFood}</p>
                      </div>
                    )}
                    
                    {selectedInsight.pattern.timeWindow && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Time Window</p>
                        <p className="text-sm font-medium">{selectedInsight.pattern.timeWindow}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Confidence Level</p>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded ${getConfidenceColor(selectedInsight.confidence)}`}>
                          {selectedInsight.confidence}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Points */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">How This Insight Was Calculated</h3>
                  <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                    <p>
                      <strong>Data Points:</strong> This pattern is based on <strong>{selectedInsight.dataPoints}</strong> occurrence{selectedInsight.dataPoints !== 1 ? 's' : ''} where {selectedInsight.pattern.symptom} was logged after {selectedInsight.pattern.followsFood || 'eating'}.
                    </p>
                    <p>
                      <strong>Confidence Level:</strong> {selectedInsight.confidence === 'high' 
                        ? 'High confidence (5+ occurrences)' 
                        : selectedInsight.confidence === 'medium' 
                        ? 'Medium confidence (3-4 occurrences)' 
                        : 'Low confidence (2 occurrences)'} - The more times this pattern appears, the higher the confidence.
                    </p>
                    {selectedInsight.pattern.timeWindow && (
                      <p>
                        <strong>Timing:</strong> Symptoms typically appear within {selectedInsight.pattern.timeWindow} after eating the linked food.
                      </p>
                    )}
                  </div>
                </div>

                {/* Methodology */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">How Patterns Are Detected</h3>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                    <li>Patterns are detected when you log symptoms and link them to specific foods</li>
                    <li>A pattern is identified when the same symptom appears after the same food (or food tag) multiple times</li>
                    <li>Confidence increases with the number of occurrences</li>
                    <li>Time windows are calculated as the average time between food and symptom</li>
                    <li>These are observations from your data only - not medical diagnoses</li>
                  </ul>
                </div>

                {/* Disclaimer */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    <strong>Important:</strong> This insight is based solely on patterns in your logged data. It is not medical advice, diagnosis, or treatment. Always consult with a healthcare professional for medical concerns.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedInsight(null)}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
