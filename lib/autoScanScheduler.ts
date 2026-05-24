import { AutoScanSettings, PhotoUpload, FoodLog } from '@/types';

export function photoFingerprint(file: File): string {
  return `${file.name}|${file.size}|${file.lastModified}`;
}

export function shouldRunScan(settings: AutoScanSettings): boolean {
  if (!settings.enabled || settings.frequency === 'manual') return false;
  if (!settings.lastScanTime) return true;
  const last = settings.lastScanTime instanceof Date
    ? settings.lastScanTime.getTime()
    : new Date(settings.lastScanTime).getTime();
  if (Number.isNaN(last)) return true;
  const elapsed = Date.now() - last;
  const threshold = settings.frequency === 'hourly' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  return elapsed >= threshold;
}

export interface ScanCallbacks {
  addFoodLog: (log: Omit<FoodLog, 'id' | 'timestamp'>) => void;
  addPhotoUpload: (upload: Omit<PhotoUpload, 'id' | 'uploadedAt'>) => void;
  setAutoScanSettings: (s: AutoScanSettings) => void;
  onProgress?: (done: number, total: number) => void;
}

export interface ScanResult {
  processed: number;
  skipped: number;
  notFood: number;
  failed: number;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function runScan(
  files: File[],
  settings: AutoScanSettings,
  photoUploads: PhotoUpload[],
  cb: ScanCallbacks
): Promise<ScanResult> {
  const result: ScanResult = { processed: 0, skipped: 0, notFood: 0, failed: 0 };
  const processedSet = new Set(settings.processedPhotos);
  const uploadIds = new Set(photoUploads.map((p) => p.id));
  const updatedProcessed = [...settings.processedPhotos];

  let i = 0;
  for (const file of files) {
    i++;
    const hash = photoFingerprint(file);
    if (processedSet.has(hash) || uploadIds.has(hash)) {
      result.skipped++;
      cb.onProgress?.(i, files.length);
      continue;
    }

    try {
      const base64 = await fileToBase64(file);

      const detectResponse = await fetch('/api/openai/detect-food-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      if (!detectResponse.ok) {
        result.failed++;
        cb.onProgress?.(i, files.length);
        continue;
      }
      const detection = await detectResponse.json();

      if (!detection.isFood || (typeof detection.confidence === 'number' && detection.confidence <= 0.7)) {
        result.notFood++;
        processedSet.add(hash);
        updatedProcessed.push(hash);
        cb.onProgress?.(i, files.length);
        continue;
      }

      const [foodResponse, macroResponse, dataUrl] = await Promise.all([
        fetch('/api/openai/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 }),
        }),
        fetch('/api/openai/analyze-food-macros', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            foodName: detection.foodDetected || '',
          }),
        }),
        fileToDataUrl(file),
      ]);

      const foodData = foodResponse.ok ? await foodResponse.json() : {};
      const macroData = macroResponse.ok ? await macroResponse.json() : {};

      cb.addFoodLog({
        food: foodData.food || detection.foodDetected || 'Food from photo',
        quantity: foodData.quantity || detection.portionSize,
        tags: Array.isArray(foodData.tags) ? foodData.tags : [],
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

      cb.addPhotoUpload({
        fileUrl: dataUrl,
        parsedContent: typeof foodData.food === 'string' ? foodData.food : undefined,
      });

      processedSet.add(hash);
      updatedProcessed.push(hash);
      result.processed++;
    } catch (err) {
      console.error('Photo scan failed:', err);
      result.failed++;
    }
    cb.onProgress?.(i, files.length);
  }

  cb.setAutoScanSettings({
    ...settings,
    processedPhotos: updatedProcessed,
    lastScanTime: new Date(),
  });

  return result;
}
