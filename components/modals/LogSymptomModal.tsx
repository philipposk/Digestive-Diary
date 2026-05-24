'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { SeverityLevel, Symptom } from '@/types';
import { FoodLog } from '@/types';
import { useVoiceCapture } from '@/lib/hooks/useVoiceCapture';
import { rankSuspectFoods } from '@/lib/suspectFoods';
import { generateInsights } from '@/lib/generateInsights';

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
  'rash',
  'pimple',
  'skin irritation',
  'sugar craving',
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
  const [linkedSymptomId, setLinkedSymptomId] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const addSymptom = useAppStore((state) => state.addSymptom);
  const updateSymptom = useAppStore((state) => state.updateSymptom);
  const foodLogs = useAppStore((state) => state.foodLogs);
  const symptoms = useAppStore((state) => state.symptoms);
  const experiments = useAppStore((state) => state.experiments);
  const voice = useVoiceCapture();

  const effectiveType = type === 'other' ? customType : type;
  const suspectFoods = useMemo(() => {
    if (!effectiveType) return [];
    const recent48h = foodLogs.filter((f) => {
      const t = f.timestamp instanceof Date ? f.timestamp.getTime() : new Date(f.timestamp).getTime();
      return (Date.now() - t) / 3.6e6 <= 48;
    });
    if (recent48h.length === 0) return [];
    const insights = generateInsights(foodLogs, symptoms, experiments);
    return rankSuspectFoods(effectiveType, recent48h, insights, symptoms);
  }, [effectiveType, foodLogs, symptoms, experiments]);

  const handleVoiceClick = async () => {
    if (voice.recording) {
      const transcript = await voice.stop();
      if (!transcript) return;
      setNotes((prev) => (prev.trim() ? `${prev.trim()}\n${transcript}` : transcript));
      if (!type) {
        const lower = transcript.toLowerCase();
        const matched = symptomTypes.find((s) => s !== 'other' && lower.includes(s.toLowerCase()));
        if (matched) setType(matched);
      }
    } else {
      await voice.start();
    }
  };

  // Get recent food logs (last 24 hours) for linking
  const recentFoodLogs = foodLogs
    .filter((log) => {
      const hoursAgo = (Date.now() - log.timestamp.getTime()) / (1000 * 60 * 60);
      return hoursAgo <= 24;
    })
    .slice(0, 10)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Get previous symptoms of the same type for linking (last 30 days)
  const previousSymptoms = symptoms
    .filter((s) => {
      if (type && type !== 'other') {
        return s.type === type;
      }
      return true;
    })
    .filter((s) => {
      const daysAgo = (Date.now() - s.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 30;
    })
    .slice(0, 10)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setType('');
      setCustomType('');
      setSeverity(5);
      setDuration('');
      setNotes('');
      setLinkedFoodId('');
      setLinkedSymptomId('');
      setPhotoUrl('');
      setPhotoFile(null);
      setAiAnalysis(null);
    }
  }, [isOpen]);

  const handlePhotoUpload = async (file: File) => {
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPhotoUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const analyzePhoto = async () => {
    if (!photoFile) return;

    setAnalyzingPhoto(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        // Get recent food logs for context
        const recentFoods = foodLogs
          .filter((log) => {
            const hoursAgo = (Date.now() - log.timestamp.getTime()) / (1000 * 60 * 60);
            return hoursAgo <= 48;
          })
          .slice(0, 20);

        const response = await fetch('/api/openai/analyze-symptom-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            userData: { foodLogs: recentFoods },
          }),
        });

        const analysis = await response.json();
        setAiAnalysis(analysis);
      };
      reader.readAsDataURL(photoFile);
    } catch (error) {
      console.error('Error analyzing photo:', error);
      alert('Failed to analyze photo. Please try again.');
    } finally {
      setAnalyzingPhoto(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const symptomType = type === 'other' ? customType.trim() : type;
    if (!symptomType) return;

    const newSymptom: Omit<Symptom, 'id' | 'timestamp'> = {
      type: symptomType,
      severity,
      duration: duration.trim() || undefined,
      notes: notes.trim() || undefined,
      linkedFoodId: linkedFoodId || undefined,
      linkedSymptomId: linkedSymptomId || undefined,
      photoUrl: photoUrl || undefined,
      aiAnalysis: aiAnalysis
        ? {
            description: aiAnalysis.description,
            suggestion: aiAnalysis.suggestion,
            possibleCauses: aiAnalysis.possibleCauses || [],
            analysisTimestamp: new Date(),
          }
        : undefined,
    };

    addSymptom(newSymptom);

    // Reset form
    setType('');
    setCustomType('');
    setSeverity(5);
    setDuration('');
    setNotes('');
    setLinkedFoodId('');
    setLinkedSymptomId('');
    setPhotoUrl('');
    setPhotoFile(null);
    setAiAnalysis(null);
    onClose();
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
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

            {/* Photo Upload Section */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Photo (optional) - for visual symptoms like rashes, pimples, etc.
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoUpload(file);
                }}
                className="hidden"
              />
              <div className="space-y-2">
                {!photoUrl ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-accent-500 dark:hover:border-accent-500 transition-colors text-gray-600 dark:text-gray-400"
                  >
                    📷 Take or Upload Photo
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <img
                        src={photoUrl}
                        alt="Symptom photo"
                        className="w-full rounded-lg max-h-48 object-contain bg-gray-100 dark:bg-gray-900"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoUrl('');
                          setPhotoFile(null);
                          setAiAnalysis(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                    {!aiAnalysis && (
                      <button
                        type="button"
                        onClick={analyzePhoto}
                        disabled={analyzingPhoto}
                        className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        {analyzingPhoto ? 'Analyzing...' : '🤖 Analyze Photo with AI'}
                      </button>
                    )}
                  </div>
                )}
                
                {/* AI Analysis Results */}
                {aiAnalysis && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">AI Analysis</h4>
                    
                    {aiAnalysis.description && (
                      <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Description:</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">{aiAnalysis.description}</p>
                      </div>
                    )}
                    
                    {aiAnalysis.documentationTips && (
                      <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Documentation Tips:</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">{aiAnalysis.documentationTips}</p>
                      </div>
                    )}
                    
                    {aiAnalysis.suggestion && (
                      <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Recommendation:</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">{aiAnalysis.suggestion}</p>
                      </div>
                    )}
                    
                    {aiAnalysis.possibleCauses && aiAnalysis.possibleCauses.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Possible Connections:</p>
                        <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1">
                          {aiAnalysis.possibleCauses.map((cause: string, idx: number) => (
                            <li key={idx}>{cause}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {aiAnalysis.disclaimer && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 italic mt-2">
                        {aiAnalysis.disclaimer}
                      </p>
                    )}
                  </div>
                )}
              </div>
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
                Link to Previous Symptom (optional)
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Track how this symptom evolves - link to a previous occurrence
              </p>
              <select
                value={linkedSymptomId}
                onChange={(e) => setLinkedSymptomId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="">None - New symptom occurrence</option>
                {previousSymptoms.map((symptom) => (
                  <option key={symptom.id} value={symptom.id}>
                    {formatDate(symptom.timestamp)} - {symptom.type} (severity: {symptom.severity}/10)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Link to Food (optional)
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Did a specific food cause this symptom?
              </p>

              {suspectFoods.length > 0 && (
                <div className="mb-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                  <p className="text-xs font-medium text-orange-800 dark:text-orange-200 mb-2">
                    Likely culprits (based on your history)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suspectFoods.map((suspect) => (
                      <button
                        key={suspect.foodLogId}
                        type="button"
                        onClick={() => setLinkedFoodId(suspect.foodLogId)}
                        title={suspect.reasons.join(' • ')}
                        className={`text-left px-3 py-1.5 rounded text-xs border ${
                          linkedFoodId === suspect.foodLogId
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-white dark:bg-gray-800 border-orange-300 dark:border-orange-700 text-orange-900 dark:text-orange-200 hover:bg-orange-100 dark:hover:bg-orange-900/40'
                        }`}
                      >
                        <div className="font-medium">{suspect.food}</div>
                        <div className="opacity-75">
                          {suspect.hoursAgo.toFixed(1)}h ago • score {Math.round(suspect.score)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
              <div className="flex gap-2 items-start">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder="Any additional notes..."
                  rows={3}
                />
                {voice.supported && (
                  <button
                    type="button"
                    onClick={handleVoiceClick}
                    disabled={voice.transcribing}
                    title={voice.recording ? 'Stop recording' : 'Dictate notes'}
                    aria-label={voice.recording ? 'Stop recording' : 'Start voice notes'}
                    className={`px-3 py-2 border rounded-lg ${
                      voice.recording
                        ? 'bg-red-500 text-white border-red-500 animate-pulse'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    } disabled:opacity-50`}
                  >
                    {voice.recording ? '■' : '🎤'}
                  </button>
                )}
              </div>
              {voice.recording && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">Recording… tap ■ when done.</p>
              )}
              {voice.transcribing && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Transcribing…</p>
              )}
              {voice.error && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{voice.error}</p>
              )}
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
                disabled={!type || (type === 'other' && !customType.trim()) || analyzingPhoto}
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
