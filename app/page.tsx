'use client';

import { useState } from 'react';
import { formatTime } from '@/lib/utils';

export default function HomePage() {
  const [today] = useState(new Date());

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
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
        <button className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-4 px-6 rounded-lg text-lg transition-colors">
          + Log Food
        </button>
        <button className="bg-accent-500 hover:bg-accent-600 text-white font-medium py-4 px-6 rounded-lg text-lg transition-colors">
          + Log Symptom
        </button>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Today&apos;s Timeline</h2>
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              No entries yet. Start by logging your food or symptoms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

