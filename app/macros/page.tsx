'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function MacrosPage() {
  const foodLogs = useAppStore((state) => state.foodLogs);
  const macroGoals = useAppStore((state) => state.macroGoals);
  const setMacroGoals = useAppStore((state) => state.setMacroGoals);

  // Calculate today's totals
  const todayTotals = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayLogs = foodLogs.filter((log) => {
      const logTimestamp = log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp);
      const logDate = new Date(logTimestamp);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime();
    });

    return todayLogs.reduce(
      (acc, log) => ({
        calories: acc.calories + (log.macros?.calories || 0),
        protein: acc.protein + (log.macros?.protein || 0),
        carbs: acc.carbs + (log.macros?.carbs || 0),
        fat: acc.fat + (log.macros?.fat || 0),
        fiber: acc.fiber + (log.macros?.fiber || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
  }, [foodLogs]);

  const getPercentage = (current: number, goal: number | undefined) => {
    if (!goal || goal === 0) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  const MacroProgressBar = ({ 
    label, 
    current, 
    goal, 
    unit, 
    color 
  }: { 
    label: string; 
    current: number; 
    goal: number | undefined; 
    unit: string;
    color: string;
  }) => {
    const percentage = getPercentage(current, goal);
    const remaining = goal ? Math.max(0, goal - current) : 0;

    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {current.toFixed(1)} / {goal ? goal.toFixed(1) : '—'} {unit}
            {goal && ` (${percentage.toFixed(0)}%)`}
          </span>
        </div>
        {goal ? (
          <>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full ${color}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            {remaining > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {remaining.toFixed(1)} {unit} remaining
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400">No goal set</p>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-6">Daily Macronutrients</h1>
      
      <div className="mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {formatDate(new Date())}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-medium mb-4">Today&apos;s Progress</h2>
        
        <MacroProgressBar
          label="Calories"
          current={todayTotals.calories}
          goal={macroGoals?.calories}
          unit="kcal"
          color="bg-blue-500"
        />
        
        <MacroProgressBar
          label="Protein"
          current={todayTotals.protein}
          goal={macroGoals?.protein}
          unit="g"
          color="bg-green-500"
        />
        
        <MacroProgressBar
          label="Carbohydrates"
          current={todayTotals.carbs}
          goal={macroGoals?.carbs}
          unit="g"
          color="bg-yellow-500"
        />
        
        <MacroProgressBar
          label="Fat"
          current={todayTotals.fat}
          goal={macroGoals?.fat}
          unit="g"
          color="bg-orange-500"
        />
        
        <MacroProgressBar
          label="Fiber"
          current={todayTotals.fiber}
          goal={macroGoals?.fiber}
          unit="g"
          color="bg-purple-500"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-medium mb-4">Set Daily Goals</h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Calories (kcal)</label>
              <input
                type="number"
                value={macroGoals?.calories || ''}
                onChange={(e) => setMacroGoals({ 
                  ...macroGoals, 
                  calories: e.target.value ? Number(e.target.value) : undefined 
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="e.g., 2000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Protein (g)</label>
              <input
                type="number"
                value={macroGoals?.protein || ''}
                onChange={(e) => setMacroGoals({ 
                  ...macroGoals, 
                  protein: e.target.value ? Number(e.target.value) : undefined 
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="e.g., 150"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Carbs (g)</label>
              <input
                type="number"
                value={macroGoals?.carbs || ''}
                onChange={(e) => setMacroGoals({ 
                  ...macroGoals, 
                  carbs: e.target.value ? Number(e.target.value) : undefined 
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="e.g., 200"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Fat (g)</label>
              <input
                type="number"
                value={macroGoals?.fat || ''}
                onChange={(e) => setMacroGoals({ 
                  ...macroGoals, 
                  fat: e.target.value ? Number(e.target.value) : undefined 
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="e.g., 65"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Fiber (g)</label>
              <input
                type="number"
                value={macroGoals?.fiber || ''}
                onChange={(e) => setMacroGoals({ 
                  ...macroGoals, 
                  fiber: e.target.value ? Number(e.target.value) : undefined 
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="e.g., 25"
              />
            </div>
          </div>
          
          <button
            onClick={() => setMacroGoals(null)}
            className="text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Clear goals
          </button>
        </div>
      </div>

      <div className="mt-6">
        <Link 
          href="/"
          className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
        >
          ← Back to Log
        </Link>
      </div>
    </div>
  );
}
