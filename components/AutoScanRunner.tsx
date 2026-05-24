'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { runScan, shouldRunScan } from '@/lib/autoScanScheduler';

const TICK_MS = 5 * 60 * 1000;

export default function AutoScanRunner() {
  const autoScanSettings = useAppStore((s) => s.autoScanSettings);
  const setAutoScanSettings = useAppStore((s) => s.setAutoScanSettings);
  const addFoodLog = useAppStore((s) => s.addFoodLog);
  const addPhotoUpload = useAppStore((s) => s.addPhotoUpload);
  const photoUploads = useAppStore((s) => s.photoUploads);
  const settingsRef = useRef(autoScanSettings);
  const uploadsRef = useRef(photoUploads);
  const promptedAtRef = useRef<number>(0);

  const [showPrompt, setShowPrompt] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => { settingsRef.current = autoScanSettings; }, [autoScanSettings]);
  useEffect(() => { uploadsRef.current = photoUploads; }, [photoUploads]);

  useEffect(() => {
    const check = () => {
      if (!shouldRunScan(settingsRef.current)) return;
      const elapsed = Date.now() - promptedAtRef.current;
      if (elapsed < 30 * 60 * 1000) return;
      setShowPrompt(true);
      promptedAtRef.current = Date.now();
    };
    check();
    const id = window.setInterval(check, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  const handlePick = async () => {
    setShowPrompt(false);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length === 0) return;
      setProgress({ done: 0, total: files.length });
      try {
        const r = await runScan(files, settingsRef.current, uploadsRef.current, {
          addFoodLog,
          addPhotoUpload,
          setAutoScanSettings,
          onProgress: (done, total) => setProgress({ done, total }),
        });
        setResult(`Logged ${r.processed} food photos. Skipped ${r.skipped} duplicates. ${r.notFood} not food. ${r.failed} failed.`);
      } catch (err) {
        console.error(err);
        setResult('Scan failed. Try again from Settings.');
      } finally {
        setProgress(null);
      }
    };
    input.click();
  };

  if (!showPrompt && !progress && !result) return null;

  return (
    <div className="fixed bottom-24 right-4 z-40 max-w-xs">
      {showPrompt && (
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-3 mb-2">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Scan recent photos?</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Auto-scan is on. Pick the latest album photos and we'll log any food we recognize.</p>
          <div className="flex gap-2">
            <button onClick={handlePick} className="flex-1 px-3 py-1.5 text-sm bg-primary-500 text-white rounded hover:bg-primary-600">Pick photos</button>
            <button onClick={() => setShowPrompt(false)} className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">Later</button>
          </div>
        </div>
      )}
      {progress && (
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-3 mb-2">
          <p className="text-sm text-gray-900 dark:text-gray-100">Scanning {progress.done} / {progress.total}…</p>
        </div>
      )}
      {result && (
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="text-sm text-gray-900 dark:text-gray-100 mb-2">{result}</p>
          <button onClick={() => setResult(null)} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">Dismiss</button>
        </div>
      )}
    </div>
  );
}
