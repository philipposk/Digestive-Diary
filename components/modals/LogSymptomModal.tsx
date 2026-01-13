'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { SeverityLevel } from '@/types';
import { FoodLog } from '@/types';

interface LogSymptomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const symptomTypes = [
  'bloating', 
  'pain', 
  'nausea', 
  'gas', 
  'constipation', 
  'diarrhea', 
  'heartburn',
  'hypoglycemia',
  'low energy',
  'low concentration',
  'cramps',
  'intestinal pinching',
  'inflammation',
  'other'
];
const severityLevels: SeverityLevel[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function LogSymptomModal({ isOpen, onClose }: LogSymptomModalProps) {
  const [type, setType] = useState('');
  const [customType, setCustomType] = useState('');
  const [severity, setSeverity] = useState<SeverityLevel>(5);
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [linkedFoodId, setLinkedFoodId] = useState<string>('');
  const addSymptom = useAppStore((state) => state.addSymptom);
  const foodLogs = useAppStore((state) => state.foodLogs);

  // Get recent food logs (last 24 hours) for linking
  const recentFoodLogs = foodLogs
    .filter((log) => {
      const hoursAgo = (Date.now() - log.timestamp.getTime()) / (1000 * 60 * 60);
      return hoursAgo <= 24;
    })
    .slice(0, 10) // Show last 10
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const symptomType = type === 'other' ? customType.trim() : type;
    if (!symptomType) return;

    addSymptom({
      type: symptomType,
      severity,
      duration: duration.trim() || undefined,
      notes: notes.trim() || undefined,
      linkedFoodId: linkedFoodId || undefined,
    });

    // Reset form
    setType('');
    setCustomType('');
    setSeverity(5);
    setDuration('');
    setNotes('');
    setLinkedFoodId('');
    onClose();
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Log Symptom</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Symptom Type *</label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {symptomTypes.map((symptom) => (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => setType(symptom)}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      type === symptom
                        ? 'bg-accent-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {symptom}
                  </button>
                ))}
              </div>
              {type === 'other' && (
                <input
                  type="text"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 mt-2"
                  placeholder="Enter symptom type"
                  autoFocus
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Severity: {severity}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={severity}
                onChange={(e) => setSeverity(parseInt(e.target.value) as SeverityLevel)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>1 (mild)</span>
                <span>10 (severe)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Duration (optional)</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="e.g., 30 minutes, 2 hours"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Link to Food (optional)
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Did a specific food cause this symptom?
              </p>
              <select
                value={linkedFoodId}
                onChange={(e) => setLinkedFoodId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="">None - Don&apos;t link</option>
                {recentFoodLogs.map((food) => (
                  <option key={food.id} value={food.id}>
                    {formatTime(food.timestamp)} - {food.food}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600"
                disabled={!type || (type === 'other' && !customType.trim())}
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
