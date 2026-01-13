'use client';

import { useState, useMemo, useEffect } from 'react';
import { formatTime } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import LogFoodModal from '@/components/modals/LogFoodModal';
import LogSymptomModal from '@/components/modals/LogSymptomModal';
import { generateSampleData } from '@/lib/generateSampleData';
import { FoodLog, Symptom } from '@/types';

export default function HomePage() {
  const [today] = useState(new Date());
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [showSymptomModal, setShowSymptomModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);
  const [showClearDemoButton, setShowClearDemoButton] = useState(false);
  
  const foodLogs = useAppStore((state) => state.foodLogs);
  const symptoms = useAppStore((state) => state.symptoms);
  const setFoodLogs = useAppStore((state) => state.setFoodLogs);
  const setSymptoms = useAppStore((state) => state.setSymptoms);
  const setContexts = useAppStore((state) => state.setContexts);
  const setExperiments = useAppStore((state) => state.setExperiments);
  const experiments = useAppStore((state) => state.experiments);
  const contexts = useAppStore((state) => state.contexts);

  // Check if welcome banner was dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('welcomeBannerDismissed');
    if (dismissed === 'true') {
      setShowWelcomeBanner(false);
    }
  }, []);

  // Check if demo data was cleared
  useEffect(() => {
    const demoCleared = localStorage.getItem('demoDataCleared');
    const hasData = foodLogs.length > 0 || symptoms.length > 0 || experiments.length > 0;
    setShowClearDemoButton(!demoCleared && hasData);
  }, [foodLogs.length, symptoms.length, experiments.length]);

  // Generate sample data on first load if no data exists
  useEffect(() => {
    if (foodLogs.length === 0) {
      const sampleData = generateSampleData();
      setFoodLogs(sampleData.foodLogs);
      setSymptoms(sampleData.symptoms);
      setContexts(sampleData.contexts);
      setExperiments(sampleData.experiments);
    }
  }, [foodLogs.length, setFoodLogs, setSymptoms, setContexts, setExperiments]);

  const handleDismissWelcome = () => {
    setShowWelcomeBanner(false);
    localStorage.setItem('welcomeBannerDismissed', 'true');
  };

  const handleClearDemoData = () => {
    if (confirm('Are you sure you want to clear all demo data and start fresh? This cannot be undone.')) {
      setFoodLogs([]);
      setSymptoms([]);
      setContexts([]);
      setExperiments([]);
      localStorage.setItem('demoDataCleared', 'true');
      setShowClearDemoButton(false);
    }
  };

  const todayItems = useMemo(() => {
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const items: Array<{ type: 'food' | 'symptom'; data: FoodLog | Symptom; timestamp: Date; linkedFood?: FoodLog }> = [];
    
    foodLogs.forEach((log) => {
      if (log.timestamp >= todayStart && log.timestamp <= todayEnd) {
        items.push({ type: 'food', data: log, timestamp: log.timestamp });
      }
    });

    symptoms.forEach((symptom) => {
      if (symptom.timestamp >= todayStart && symptom.timestamp <= todayEnd) {
        const linkedFood = symptom.linkedFoodId 
          ? foodLogs.find((f) => f.id === symptom.linkedFoodId)
          : undefined;
        items.push({ type: 'symptom', data: symptom, timestamp: symptom.timestamp, linkedFood });
      }
    });

    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [foodLogs, symptoms, today]);

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { foods: [], symptoms: [], experiments: [] };

    const query = searchQuery.toLowerCase();
    const matchedFoods = foodLogs.filter(
      (log) =>
        log.food.toLowerCase().includes(query) ||
        log.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        log.notes?.toLowerCase().includes(query)
    );
    const matchedSymptoms = symptoms.filter(
      (symptom) =>
        symptom.type.toLowerCase().includes(query) ||
        symptom.notes?.toLowerCase().includes(query)
    );
    const matchedExperiments = experiments.filter(
      (exp) =>
        exp.name.toLowerCase().includes(query) ||
        exp.notes?.toLowerCase().includes(query)
    );

    return {
      foods: matchedFoods.slice(0, 10),
      symptoms: matchedSymptoms.slice(0, 10),
      experiments: matchedExperiments.slice(0, 10),
    };
  }, [searchQuery, foodLogs, symptoms, experiments]);

  return (
    <>
      <div className="w-full max-w-2xl mx-auto px-4 py-6">
        {/* Welcome Banner */}
        {showWelcomeBanner && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-5 relative">
            <button
              onClick={handleDismissWelcome}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Dismiss welcome message"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="pr-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Digestive Diary
              </h1>
              <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                A platform to help you track your food, symptoms, and patterns. Log what you eat and how you feel, discover connections over time, and organize your data for better insights. This is a logging tool, not medical advice.
              </p>
            </div>
          </div>
        )}

        {/* Clear Demo Data Button */}
        {showClearDemoButton && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  Demo Data Loaded
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  This app is showing sample data. Clear it to start logging your own data.
                </p>
              </div>
              <button
                onClick={handleClearDemoData}
                className="ml-4 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                Clear Demo Data
              </button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(e.target.value.trim().length > 0);
            }}
            placeholder="Search foods, symptoms, experiments..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Search Results */}
        {showSearchResults && searchQuery.trim() && (
          <div className="mb-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Search Results</h2>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchResults(false);
                }}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear
              </button>
            </div>

            {(searchResults.foods.length > 0 ||
              searchResults.symptoms.length > 0 ||
              searchResults.experiments.length > 0) ? (
              <div className="space-y-3">
                {searchResults.foods.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Foods ({searchResults.foods.length})
                    </h3>
                    <div className="space-y-1">
                      {searchResults.foods.map((log) => (
                        <div
                          key={log.id}
                          className="text-sm p-2 bg-white dark:bg-gray-700 rounded"
                        >
                          {log.food} {log.tags.length > 0 && `(${log.tags.join(', ')})`}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.symptoms.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Symptoms ({searchResults.symptoms.length})
                    </h3>
                    <div className="space-y-1">
                      {searchResults.symptoms.map((symptom) => (
                        <div
                          key={symptom.id}
                          className="text-sm p-2 bg-white dark:bg-gray-700 rounded"
                        >
                          {symptom.type} (severity: {symptom.severity}/10)
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.experiments.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Experiments ({searchResults.experiments.length})
                    </h3>
                    <div className="space-y-1">
                      {searchResults.experiments.map((exp) => (
                        <div
                          key={exp.id}
                          className="text-sm p-2 bg-white dark:bg-gray-700 rounded"
                        >
                          {exp.name} ({exp.active ? 'active' : 'completed'})
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ask AI about search */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <a
                    href={`/chat?query=${encodeURIComponent(searchQuery)}`}
                    className="block text-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                  >
                    💬 Ask AI about &quot;{searchQuery}&quot;
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                <p className="mb-2">No results found for &quot;{searchQuery}&quot;</p>
                <a
                  href={`/chat?query=${encodeURIComponent(searchQuery)}`}
                  className="inline-block px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors text-sm"
                >
                  💬 Ask AI about &quot;{searchQuery}&quot;
                </a>
              </div>
            )}
          </div>
        )}

        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Today</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {today.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-8">
          <button 
            onClick={() => setShowFoodModal(true)}
            className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-4 px-6 rounded-lg text-lg transition-colors"
          >
            + Log Food
          </button>
          <button 
            onClick={() => setShowSymptomModal(true)}
            className="bg-accent-500 hover:bg-accent-600 text-white font-medium py-4 px-6 rounded-lg text-lg transition-colors"
          >
            + Log Symptom
          </button>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Today&apos;s Timeline</h2>
          <div className="space-y-4">
            {todayItems.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  No entries yet. Start by logging your food or symptoms.
                </p>
              </div>
            ) : (
              todayItems.map((item) => (
                <div
                  key={item.data.id}
                  className={`rounded-lg p-4 ${
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
                        {item.type === 'symptom' && 'linkedFood' in item && item.linkedFood && (
                          <div className="text-xs text-red-700 dark:text-red-300 mt-1">
                            ← After: {item.linkedFood.food} ({formatTime(item.linkedFood.timestamp)})
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
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
              ))
            )}
          </div>
        </div>
      </div>

      <LogFoodModal isOpen={showFoodModal} onClose={() => setShowFoodModal(false)} />
      <LogSymptomModal isOpen={showSymptomModal} onClose={() => setShowSymptomModal(false)} />
    </>
  );
}
