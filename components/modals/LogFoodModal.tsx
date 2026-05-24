'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useVoiceCapture } from '@/lib/hooks/useVoiceCapture';

interface LogFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const commonTags = ['dairy', 'gluten', 'spicy', 'raw', 'processed', 'fiber-rich', 'fatty', 'alcohol'];

export default function LogFoodModal({ isOpen, onClose }: LogFoodModalProps) {
  const [food, setFood] = useState('');
  const [quantity, setQuantity] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [macros, setMacros] = useState<{ calories?: number; protein?: number; carbs?: number; fat?: number; fiber?: number; } | null>(null);
  const [portionWeight, setPortionWeight] = useState<number | undefined>(undefined);
  const [showMacros, setShowMacros] = useState(false);
  const [voiceParsing, setVoiceParsing] = useState(false);
  const addFoodLog = useAppStore((state) => state.addFoodLog);
  const voice = useVoiceCapture();

  if (!isOpen) return null;

  const handleVoiceClick = async () => {
    if (voice.recording) {
      const transcript = await voice.stop();
      if (!transcript) return;
      setFood(transcript);
      setVoiceParsing(true);
      try {
        const res = await fetch('/api/openai/parse-food', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: transcript }),
        });
        if (res.ok) {
          const data = await res.json();
          const first = Array.isArray(data?.foods) && data.foods.length > 0 ? data.foods[0] : null;
          if (first?.name) setFood(first.name);
          if (first?.quantity) setQuantity(first.quantity);
          const tagPool = [
            ...(Array.isArray(first?.tags) ? first.tags : []),
            ...(Array.isArray(data?.suggested_tags) ? data.suggested_tags : []),
          ].map((t: any) => String(t).toLowerCase());
          const matched = Array.from(new Set(tagPool.filter((t) => commonTags.includes(t))));
          if (matched.length > 0) setSelectedTags(matched);
        }
      } catch {
        // Silent — transcript already in food field
      } finally {
        setVoiceParsing(false);
      }
    } else {
      await voice.start();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!food.trim()) return;

    addFoodLog({
      food: food.trim(),
      quantity: quantity.trim() || undefined,
      tags: selectedTags,
      notes: notes.trim() || undefined,
      macros: macros || undefined,
      portionWeight: portionWeight,
    });

    // Reset form
    setFood('');
    setQuantity('');
    setSelectedTags([]);
    setNotes('');
    setImagePreview(null);
    setMacros(null);
    setPortionWeight(undefined);
    setShowMacros(false);
    onClose();
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Analyze image
    setIsAnalyzing(true);
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

      const response = await fetch('/api/openai/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const data = await response.json();
      
      // Populate form with extracted data
      if (data.food) setFood(data.food);
      if (data.quantity) setQuantity(data.quantity);
      if (data.tags && Array.isArray(data.tags)) {
        setSelectedTags(data.tags.filter((tag: string) => commonTags.includes(tag.toLowerCase())));
      }
      if (data.notes) setNotes(data.notes);
      if (data.macros) {
        setMacros(data.macros);
        setShowMacros(true);
      }

      // Also analyze for macro estimation if no macros from label
      if (!data.macros || !data.macros.calories) {
        try {
          const macroResponse = await fetch('/api/openai/analyze-food-macros', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              imageBase64: base64,
              foodName: data.food || food,
              quantity: data.quantity || quantity,
            }),
          });

          if (macroResponse.ok) {
            const macroData = await macroResponse.json();
            if (macroData.portionWeight || macroData.calories) {
              setMacros({
                calories: macroData.calories || 0,
                protein: macroData.protein || 0,
                carbs: macroData.carbs || 0,
                fat: macroData.fat || 0,
                fiber: macroData.fiber || 0,
              });
              setPortionWeight(macroData.portionWeight || undefined);
              setShowMacros(true);
            }
          }
        } catch (macroError) {
          // Silent fail - macros optional
          console.log('Macro analysis not available');
        }
      }
    } catch (error) {
      console.error('Image analysis error:', error);
      alert('Failed to analyze image. Please enter food manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Log Food</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Food *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={food}
                  onChange={(e) => setFood(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Pasta with cheese"
                  autoFocus
                  required
                />
                <label className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer" title="Upload photo from camera or album">
                  📷
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isAnalyzing}
                  />
                </label>
                {voice.supported && (
                  <button
                    type="button"
                    onClick={handleVoiceClick}
                    disabled={voice.transcribing || voiceParsing}
                    title={voice.recording ? 'Stop recording' : 'Dictate food name'}
                    aria-label={voice.recording ? 'Stop recording' : 'Start voice logging'}
                    className={`px-4 py-2 border rounded-lg ${
                      voice.recording
                        ? 'bg-red-500 text-white border-red-500 animate-pulse'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    } disabled:opacity-50`}
                  >
                    {voice.recording ? '■' : '🎤'}
                  </button>
                )}
              </div>
              {isAnalyzing && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Analyzing image...
                </p>
              )}
              {voice.recording && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">Recording… tap ■ when done.</p>
              )}
              {voice.transcribing && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Transcribing audio…</p>
              )}
              {voiceParsing && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Parsing food details…</p>
              )}
              {voice.error && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{voice.error}</p>
              )}
              {imagePreview && (
                <div className="mt-2 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full max-h-48 rounded-lg border border-gray-300 dark:border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Quantity (optional)</label>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="e.g., Large bowl, 2 slices"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tags (optional)</label>
              <div className="flex flex-wrap gap-2">
                {commonTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedTags.includes(tag)
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
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

            {showMacros && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium">Macronutrients (estimated)</label>
                  <button
                    type="button"
                    onClick={() => setShowMacros(false)}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Hide
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Calories</label>
                    <input
                      type="number"
                      value={macros?.calories || ''}
                      onChange={(e) => setMacros({ ...macros, calories: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                      placeholder="kcal"
                    />
                  </div>
                  {portionWeight !== undefined && (
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Weight (g)</label>
                      <input
                        type="number"
                        value={portionWeight}
                        onChange={(e) => setPortionWeight(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                        placeholder="grams"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Protein (g)</label>
                    <input
                      type="number"
                      value={macros?.protein || ''}
                      onChange={(e) => setMacros({ ...macros, protein: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                      placeholder="g"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Carbs (g)</label>
                    <input
                      type="number"
                      value={macros?.carbs || ''}
                      onChange={(e) => setMacros({ ...macros, carbs: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                      placeholder="g"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Fat (g)</label>
                    <input
                      type="number"
                      value={macros?.fat || ''}
                      onChange={(e) => setMacros({ ...macros, fat: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                      placeholder="g"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Fiber (g)</label>
                    <input
                      type="number"
                      value={macros?.fiber || ''}
                      onChange={(e) => setMacros({ ...macros, fiber: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                      placeholder="g"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowMacros(false);
                    setMacros(null);
                    setPortionWeight(undefined);
                  }}
                  className="mt-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Clear macros
                </button>
              </div>
            )}

            {!showMacros && (
              <button
                type="button"
                onClick={() => setShowMacros(true)}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                + Add macronutrients manually
              </button>
            )}

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

