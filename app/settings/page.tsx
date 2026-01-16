'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getTheme, setTheme, applyTheme, type Theme } from '@/lib/theme';
import { useAppStore } from '@/lib/store';

export default function SettingsPage() {
  const [currentTheme, setCurrentTheme] = useState<Theme>('system');

  useEffect(() => {
    setCurrentTheme(getTheme());
  }, []);

  const handleThemeChange = (theme: Theme) => {
    setTheme(theme);
    applyTheme(theme);
    setCurrentTheme(theme);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium mb-3">Appearance</h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700 dark:text-gray-300">Theme</span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleThemeChange('light')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentTheme === 'light'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Light
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentTheme === 'dark'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Dark
              </button>
              <button
                onClick={() => handleThemeChange('system')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentTheme === 'system'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                System
              </button>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-3">Data</h2>
          <div className="space-y-2">
            <Link href="/realizations" className="block w-full text-left bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              My Realizations
            </Link>
            <Link href="/chat" className="block w-full text-left bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              AI Chat
            </Link>
            <Link href="/sources" className="block w-full text-left bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              Knowledge Sources
            </Link>
            <Link href="/macros" className="block w-full text-left bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              Macronutrients & Goals
            </Link>
            <button
              onClick={() => {
                const store = useAppStore.getState();
                const data = {
                  foodLogs: store.foodLogs,
                  symptoms: store.symptoms,
                  contexts: store.contexts,
                  experiments: store.experiments,
                  realizations: store.realizations,
                  exportedAt: new Date().toISOString(),
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `digestive-diary-export-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="w-full text-left bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Export Data for Doctor
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete ALL data? This cannot be undone.')) {
                  const store = useAppStore.getState();
                  store.setFoodLogs([]);
                  store.setSymptoms([]);
                  store.setContexts([]);
                  store.setExperiments([]);
                  store.clearChatSession();
                  // Clear realizations
                  const realizations = [...store.realizations];
                  realizations.forEach((r) => store.deleteRealization(r.id));
                  alert('All data has been deleted.');
                }
              }}
              className="w-full text-left bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-red-600 dark:text-red-400"
            >
              Delete All Data
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-3">About</h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              Digestive Diary v0.1.0
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              A non-judgmental tracking app for digestive disorders.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-3">Disclaimer</h2>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              This app is for logging purposes only and does not provide medical advice. 
              Always consult with a healthcare professional for medical concerns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
