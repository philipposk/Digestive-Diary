'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { SleepQuality, StressLevel, ActivityLevel, BowelType } from '@/types';

interface LogContextModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LogContextModal({ isOpen, onClose }: LogContextModalProps) {
  const [sleepQuality, setSleepQuality] = useState<SleepQuality | undefined>(undefined);
  const [sleepDuration, setSleepDuration] = useState<number | undefined>(undefined);
  const [sleepStartTime, setSleepStartTime] = useState<string>('');
  const [sleepEndTime, setSleepEndTime] = useState<string>('');
  const [stressLevel, setStressLevel] = useState<StressLevel | undefined>(undefined);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | undefined>(undefined);
  const [bowelMovement, setBowelMovement] = useState<boolean | undefined>(undefined);
  const [bowelType, setBowelType] = useState<BowelType | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const addContext = useAppStore((state) => state.addContext);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert sleep times to Date objects if provided
    let sleepStartDate: Date | undefined;
    let sleepEndDate: Date | undefined;
    
    if (sleepStartTime) {
      sleepStartDate = new Date();
      const [hours, minutes] = sleepStartTime.split(':').map(Number);
      sleepStartDate.setHours(hours, minutes, 0, 0);
      // If sleep start is after midnight, assume previous day
      if (hours >= 18) {
        sleepStartDate.setDate(sleepStartDate.getDate() - 1);
      }
    }
    
    if (sleepEndTime) {
      sleepEndDate = new Date();
      const [hours, minutes] = sleepEndTime.split(':').map(Number);
      sleepEndDate.setHours(hours, minutes, 0, 0);
      // If wake time is before noon, assume same day; otherwise previous night
      if (hours < 12) {
        // Same day
      } else {
        // Might be previous night's end
      }
    }

    addContext({
      sleepQuality,
      sleepDuration,
      sleepStartTime: sleepStartDate,
      sleepEndTime: sleepEndDate,
      stressLevel,
      activityLevel,
      bowelMovement,
      bowelType,
      notes: notes.trim() || undefined,
    });

    // Reset form
    setSleepQuality(undefined);
    setSleepDuration(undefined);
    setSleepStartTime('');
    setSleepEndTime('');
    setStressLevel(undefined);
    setActivityLevel(undefined);
    setBowelMovement(undefined);
    setBowelType(undefined);
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Log Context</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Sleep Quality */}
            <div>
              <label className="block text-sm font-medium mb-2">Sleep Quality (optional)</label>
              <div className="flex flex-wrap gap-2">
                {(['poor', 'ok', 'good'] as SleepQuality[]).map((quality) => (
                  <button
                    key={quality}
                    type="button"
                    onClick={() => setSleepQuality(sleepQuality === quality ? undefined : quality)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      sleepQuality === quality
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {quality}
                  </button>
                ))}
              </div>
            </div>

            {/* Sleep Duration */}
            <div>
              <label className="block text-sm font-medium mb-2">Sleep Duration (hours, optional)</label>
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={sleepDuration || ''}
                onChange={(e) => setSleepDuration(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="e.g., 7.5"
              />
            </div>

            {/* Sleep Times */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-2">Sleep Start Time (optional)</label>
                <input
                  type="time"
                  value={sleepStartTime}
                  onChange={(e) => setSleepStartTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Wake Time (optional)</label>
                <input
                  type="time"
                  value={sleepEndTime}
                  onChange={(e) => setSleepEndTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>
            </div>

            {/* Stress Level */}
            <div>
              <label className="block text-sm font-medium mb-2">Stress Level (optional)</label>
              <div className="flex flex-wrap gap-2">
                {(['low', 'medium', 'high'] as StressLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setStressLevel(stressLevel === level ? undefined : level)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      stressLevel === level
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Activity Level */}
            <div>
              <label className="block text-sm font-medium mb-2">Activity Level (optional)</label>
              <div className="flex flex-wrap gap-2">
                {(['none', 'light', 'intense'] as ActivityLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setActivityLevel(activityLevel === level ? undefined : level)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      activityLevel === level
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Bowel Movement */}
            <div>
              <label className="block text-sm font-medium mb-2">Bowel Movement (optional)</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBowelMovement(bowelMovement === true ? undefined : true)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm ${
                    bowelMovement === true
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setBowelMovement(bowelMovement === false ? undefined : false)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm ${
                    bowelMovement === false
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Bowel Type */}
            {bowelMovement === true && (
              <div>
                <label className="block text-sm font-medium mb-2">Bowel Type (optional)</label>
                <div className="flex flex-wrap gap-2">
                  {(['normal', 'loose', 'hard', 'irregular'] as BowelType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setBowelType(bowelType === type ? undefined : type)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        bowelType === type
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
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
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
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
