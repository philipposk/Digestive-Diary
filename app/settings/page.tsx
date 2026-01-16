'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getTheme, setTheme, applyTheme, type Theme } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { FastingSettings, AutoScanSettings } from '@/types';

export default function SettingsPage() {
  const [currentTheme, setCurrentTheme] = useState<Theme>('system');
  const fastingSettings = useAppStore((state) => state.fastingSettings);
  const setFastingSettings = useAppStore((state) => state.setFastingSettings);
  const autoScanSettings = useAppStore((state) => state.autoScanSettings);
  const setAutoScanSettings = useAppStore((state) => state.setAutoScanSettings);
  const addFoodLog = useAppStore((state) => state.addFoodLog);

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
          <h2 className="text-lg font-medium mb-3">Intermittent Fasting</h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700 dark:text-gray-300">Enable Fasting Alerts</span>
              <input
                type="checkbox"
                checked={fastingSettings.enabled}
                onChange={(e) => setFastingSettings({ ...fastingSettings, enabled: e.target.checked })}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              />
            </label>
            
            {fastingSettings.enabled && (
              <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <label className="block text-sm font-medium mb-1">Fasting Window (hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={fastingSettings.fastingWindow}
                    onChange={(e) => setFastingSettings({ ...fastingSettings, fastingWindow: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Eating Window (hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={fastingSettings.eatingWindow}
                    onChange={(e) => setFastingSettings({ ...fastingSettings, eatingWindow: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Preferred Fasting Start Time (HH:MM)</label>
                  <input
                    type="time"
                    value={fastingSettings.preferredFastingStart || '20:00'}
                    onChange={(e) => setFastingSettings({ ...fastingSettings, preferredFastingStart: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
                
                <button
                  onClick={() => {
                    const lastMeal = useAppStore.getState().foodLogs
                      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
                    if (lastMeal) {
                      setFastingSettings({ ...fastingSettings, lastMealTime: lastMeal.timestamp });
                    }
                  }}
                  className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm"
                >
                  Set Last Meal Time to Most Recent Food Log
                </button>
                
                {fastingSettings.lastMealTime && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Last meal: {new Date(fastingSettings.lastMealTime).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-3">Auto Photo Scanning</h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Automatically scan your photo album for food photos and log them. Select multiple photos at once to batch process.
            </p>
            
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700 dark:text-gray-300">Enable Auto-Scan</span>
              <input
                type="checkbox"
                checked={autoScanSettings.enabled}
                onChange={(e) => setAutoScanSettings({ ...autoScanSettings, enabled: e.target.checked })}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              />
            </label>
            
            {autoScanSettings.enabled && (
              <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <label className="block text-sm font-medium mb-1">Scan Frequency</label>
                  <select
                    value={autoScanSettings.frequency}
                    onChange={(e) => setAutoScanSettings({ ...autoScanSettings, frequency: e.target.value as 'hourly' | 'daily' | 'manual' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="manual">Manual Only</option>
                    <option value="hourly">Every Hour</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>
                
                <button
                  onClick={async () => {
                    // Create file input for multiple photos
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.multiple = true;
                    
                    input.onchange = async (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (!files || files.length === 0) return;
                      
                      let processed = 0;
                      let skipped = 0;
                      
                      for (const file of Array.from(files)) {
                        // Generate simple hash from file name + size + last modified
                        const fileHash = `${file.name}-${file.size}-${file.lastModified}`;
                        
                        // Skip if already processed
                        if (autoScanSettings.processedPhotos.includes(fileHash)) {
                          skipped++;
                          continue;
                        }
                        
                        try {
                          // Convert to base64
                          const base64 = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const base64String = (reader.result as string).split(',')[1];
                              resolve(base64String);
                            };
                            reader.onerror = reject;
                            reader.readAsDataURL(file);
                          });
                          
                          // Detect if it's a food photo
                          const detectResponse = await fetch('/api/openai/detect-food-photo', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ imageBase64: base64 }),
                          });
                          
                          if (!detectResponse.ok) continue;
                          
                          const detection = await detectResponse.json();
                          
                          if (detection.isFood && detection.confidence > 0.7) {
                            // Analyze food and macros
                            const foodResponse = await fetch('/api/openai/analyze-image', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ imageBase64: base64 }),
                            });
                            
                            const macroResponse = await fetch('/api/openai/analyze-food-macros', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ 
                                imageBase64: base64,
                                foodName: detection.foodDetected || '',
                              }),
                            });
                            
                            const foodData = foodResponse.ok ? await foodResponse.json() : {};
                            const macroData = macroResponse.ok ? await macroResponse.json() : {};
                            
                            // Estimate timestamp from file date or use now
                            const photoDate = file.lastModified ? new Date(file.lastModified) : new Date();
                            
                            // Add food log
                            addFoodLog({
                              food: foodData.food || detection.foodDetected || 'Food from photo',
                              quantity: foodData.quantity || detection.portionSize,
                              tags: foodData.tags || [],
                              notes: `Auto-detected from photo (${detection.setting || 'album'})`,
                              macros: macroData.calories ? {
                                calories: macroData.calories,
                                protein: macroData.protein || 0,
                                carbs: macroData.carbs || 0,
                                fat: macroData.fat || 0,
                                fiber: macroData.fiber || 0,
                              } : undefined,
                              portionWeight: macroData.portionWeight,
                            });
                            
                            // Mark as processed
                            setAutoScanSettings({
                              ...autoScanSettings,
                              processedPhotos: [...autoScanSettings.processedPhotos, fileHash],
                              lastScanTime: new Date(),
                            });
                            
                            processed++;
                          }
                        } catch (error) {
                          console.error('Error processing photo:', error);
                        }
                      }
                      
                      alert(`Processed ${processed} food photos. Skipped ${skipped} duplicates.`);
                    };
                    
                    input.click();
                  }}
                  className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm"
                >
                  Scan Album for Food Photos
                </button>
                
                {autoScanSettings.lastScanTime && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Last scanned: {new Date(autoScanSettings.lastScanTime).toLocaleString()}
                  </p>
                )}
                
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Processed {autoScanSettings.processedPhotos.length} photos
                </p>
              </div>
            )}
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
            <Link href="/recipes" className="block w-full text-left bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              Recipe Suggestions
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
