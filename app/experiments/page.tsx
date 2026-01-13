'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { formatDate, formatTime } from '@/lib/utils';
import { Experiment } from '@/types';

export default function ExperimentsPage() {
  const experiments = useAppStore((state) => state.experiments);
  const endExperiment = useAppStore((state) => state.endExperiment);
  const [showStartModal, setShowStartModal] = useState(false);

  const activeExperiments = experiments.filter((exp) => exp.active);
  const pastExperiments = experiments.filter((exp) => !exp.active);

  const calculateDays = (startDate: Date | string, endDate?: Date | string): number => {
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate 
      ? (endDate instanceof Date ? endDate : new Date(endDate))
      : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Experiments</h1>
      
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-3">Current Experiment</h2>
        {activeExperiments.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              No active experiment. Start one to track how diet changes affect your symptoms.
            </p>
            <button 
              onClick={() => setShowStartModal(true)}
              className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Start Experiment
            </button>
          </div>
        ) : (
          activeExperiments.map((experiment) => (
            <div
              key={experiment.id}
              className="bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg p-4 mb-4"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                    {experiment.name}
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Day {calculateDays(experiment.startDate)}
                  </p>
                </div>
                <button
                  onClick={() => endExperiment(experiment.id)}
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                >
                  End
                </button>
              </div>
              {experiment.notes && (
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
                  {experiment.notes}
                </p>
              )}
              <div className="mt-3 text-xs text-blue-600 dark:text-blue-400">
                Started: {formatDate(experiment.startDate)}
              </div>
            </div>
          ))
        )}
      </div>

      {pastExperiments.length > 0 && (
        <div>
          <h2 className="text-lg font-medium mb-3">Past Experiments</h2>
          <div className="space-y-3">
            {pastExperiments.map((experiment) => (
              <div
                key={experiment.id}
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {experiment.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {calculateDays(experiment.startDate, experiment.endDate)} days
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                    Ended
                  </span>
                </div>
                {experiment.notes && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                    {experiment.notes}
                  </p>
                )}
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <div>Started: {formatDate(experiment.startDate)}</div>
                  {experiment.endDate && (
                    <div>Ended: {formatDate(experiment.endDate)}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
