'use client';

import { useState, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { formatDate, formatTime } from '@/lib/utils';
import { Experiment, ExperimentLogType } from '@/types';

export default function ExperimentsPage() {
  const experiments = useAppStore((state) => state.experiments);
  const endExperiment = useAppStore((state) => state.endExperiment);
  const addExperimentLog = useAppStore((state) => state.addExperimentLog);
  const deleteExperimentLog = useAppStore((state) => state.deleteExperimentLog);
  const updateExperiment = useAppStore((state) => state.updateExperiment);
  
  const [showStartModal, setShowStartModal] = useState(false);
  const [expandedExperimentId, setExpandedExperimentId] = useState<string | null>(null);
  const [showLogModal, setShowLogModal] = useState<string | null>(null);
  const [logType, setLogType] = useState<ExperimentLogType>('text');
  const [logContent, setLogContent] = useState('');
  const [logNotes, setLogNotes] = useState('');
  const [logImageFile, setLogImageFile] = useState<File | null>(null);
  const [logImageUrl, setLogImageUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAddLog = (experimentId: string) => {
    setShowLogModal(experimentId);
    setLogType('text');
    setLogContent('');
    setLogNotes('');
    setLogImageFile(null);
    setLogImageUrl('');
  };

  const handleImageUpload = (file: File) => {
    setLogImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setLogImageUrl(dataUrl);
      setLogContent(dataUrl); // Store data URL as content
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitLog = () => {
    if (!showLogModal) return;
    if (logType === 'text' && !logContent.trim()) return;
    if (logType === 'image' && !logContent) return;

    addExperimentLog(showLogModal, {
      type: logType,
      content: logContent,
      notes: logNotes.trim() || undefined,
    });

    // Reset form
    setShowLogModal(null);
    setLogType('text');
    setLogContent('');
    setLogNotes('');
    setLogImageFile(null);
    setLogImageUrl('');
  };

  const handleDeleteLog = (experimentId: string, logId: string) => {
    if (confirm('Are you sure you want to delete this log entry?')) {
      deleteExperimentLog(experimentId, logId);
    }
  };

  const getExperiment = (id: string) => experiments.find((exp) => exp.id === id);

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
              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  Started: {formatDate(experiment.startDate)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAddLog(experiment.id)}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors"
                  >
                    + Add Log
                  </button>
                  <button
                    onClick={() => setExpandedExperimentId(
                      expandedExperimentId === experiment.id ? null : experiment.id
                    )}
                    className="px-3 py-1 bg-blue-400 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors"
                  >
                    {expandedExperimentId === experiment.id ? 'Hide Logs' : `View Logs (${experiment.logs?.length || 0})`}
                  </button>
                </div>
              </div>

              {/* Experiment Logs */}
              {expandedExperimentId === experiment.id && experiment.logs && experiment.logs.length > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-300 dark:border-blue-700">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">
                    Logs ({experiment.logs.length})
                  </h4>
                  <div className="space-y-3">
                    {experiment.logs.map((log) => (
                      <div
                        key={log.id}
                        className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-3 border border-blue-200 dark:border-blue-800"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs px-2 py-1 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded">
                                {log.type}
                              </span>
                              <span className="text-xs text-blue-600 dark:text-blue-400">
                                {formatDate(log.timestamp)} {formatTime(log.timestamp)}
                              </span>
                            </div>
                            {log.type === 'text' && (
                              <p className="text-sm text-blue-900 dark:text-blue-100">{log.content}</p>
                            )}
                            {log.type === 'image' && (
                              <img
                                src={log.content}
                                alt="Experiment log"
                                className="max-w-full rounded-lg mt-2 max-h-48 object-contain"
                              />
                            )}
                            {log.notes && (
                              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2 italic">
                                {log.notes}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteLog(experiment.id, log.id)}
                            className="ml-2 text-red-500 hover:text-red-700 text-xs"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <div>Started: {formatDate(experiment.startDate)}</div>
                    {experiment.endDate && (
                      <div>Ended: {formatDate(experiment.endDate)}</div>
                    )}
                  </div>
                  {experiment.logs && experiment.logs.length > 0 && (
                    <button
                      onClick={() => setExpandedExperimentId(
                        expandedExperimentId === experiment.id ? null : experiment.id
                      )}
                      className="px-3 py-1 bg-gray-400 hover:bg-gray-500 text-white text-xs rounded-lg transition-colors"
                    >
                      {expandedExperimentId === experiment.id ? 'Hide Logs' : `View Logs (${experiment.logs.length})`}
                    </button>
                  )}
                </div>

                {/* Past Experiment Logs */}
                {expandedExperimentId === experiment.id && experiment.logs && experiment.logs.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      Logs ({experiment.logs.length})
                    </h4>
                    <div className="space-y-3">
                      {experiment.logs.map((log) => (
                        <div
                          key={log.id}
                          className="bg-gray-100 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                              {log.type}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(log.timestamp)} {formatTime(log.timestamp)}
                            </span>
                          </div>
                          {log.type === 'text' && (
                            <p className="text-sm text-gray-900 dark:text-gray-100">{log.content}</p>
                          )}
                          {log.type === 'image' && (
                            <img
                              src={log.content}
                              alt="Experiment log"
                              className="max-w-full rounded-lg mt-2 max-h-48 object-contain"
                            />
                          )}
                          {log.notes && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 italic">
                              {log.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Add Log Entry</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Log Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['text', 'image'] as ExperimentLogType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setLogType(type);
                          setLogContent('');
                          setLogImageUrl('');
                          setLogImageFile(null);
                        }}
                        className={`px-4 py-2 rounded-lg text-sm ${
                          logType === type
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {type === 'text' ? '📝 Text' : '🖼️ Image'}
                      </button>
                    ))}
                  </div>
                </div>

                {logType === 'text' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Content</label>
                    <textarea
                      value={logContent}
                      onChange={(e) => setLogContent(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      placeholder="Enter your log entry..."
                      rows={5}
                    />
                  </div>
                )}

                {logType === 'image' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Image</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      className="hidden"
                    />
                    {!logImageUrl ? (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors text-gray-600 dark:text-gray-400"
                      >
                        📷 Upload Image
                      </button>
                    ) : (
                      <div className="relative">
                        <img
                          src={logImageUrl}
                          alt="Log image"
                          className="w-full rounded-lg max-h-48 object-contain bg-gray-100 dark:bg-gray-900"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setLogImageUrl('');
                            setLogImageFile(null);
                            setLogContent('');
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Notes (optional)</label>
                  <textarea
                    value={logNotes}
                    onChange={(e) => setLogNotes(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLogModal(null);
                      setLogContent('');
                      setLogNotes('');
                      setLogImageUrl('');
                      setLogImageFile(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitLog}
                    className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                    disabled={(logType === 'text' && !logContent.trim()) || (logType === 'image' && !logContent)}
                  >
                    Save Log
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
