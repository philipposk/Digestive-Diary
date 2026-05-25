// Bayesian trigger probability + lagged correlation.
// For each canonical food (or tag), compute P(symptom in window | ate food today)
// vs P(symptom in window | did NOT eat food today). Report Bayes factor and
// supporting counts. Results are descriptive, never causal.

import { FoodLog, Symptom, Pattern } from '@/types';
import { INSIGHTS_CONFIG } from './insightsConfig';
import { canonicalizeFoodNames, foodKey } from './foodNormalize';

const DAY_MS = 86_400_000;

function toDate(v: Date | string): Date {
  return v instanceof Date ? v : new Date(v);
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export interface BayesResult {
  food: string;
  symptomType: string;
  lagHours: number;
  windowHours: number;
  pSymptomGivenFood: number;
  pSymptomGivenNoFood: number;
  bayesFactor: number; // pY/pN; >1 means food increases probability
  foodOccurrences: number;
  symptomDays: number;
  totalDays: number;
}

/**
 * Build day-bucket maps:
 *  - foodDays[food canonical name] -> Set<dayKey>
 *  - symptomDays[symptomType] -> Set<dayKey>
 * Then for each (food, symptomType, lag) compute conditional probabilities
 * over the full day grid implied by the data range.
 */
export function computeBayesTriggers(
  foodLogs: FoodLog[],
  symptoms: Symptom[]
): Pattern[] {
  if (foodLogs.length === 0 || symptoms.length === 0) return [];

  const canonical = canonicalizeFoodNames(foodLogs.map((f) => f.food));
  const foodDayIndex = new Map<string, Map<string, true>>(); // food -> day set
  const symptomDayIndex = new Map<string, Map<string, Symptom[]>>(); // type -> day -> symptoms
  const allDays = new Set<string>();

  let minMs = Number.POSITIVE_INFINITY;
  let maxMs = Number.NEGATIVE_INFINITY;

  foodLogs.forEach((f) => {
    const d = toDate(f.timestamp);
    const k = dayKey(d);
    allDays.add(k);
    if (d.getTime() < minMs) minMs = d.getTime();
    if (d.getTime() > maxMs) maxMs = d.getTime();
    const name = canonical.get(f.food) ?? foodKey(f.food);
    const inner = foodDayIndex.get(name) ?? new Map<string, true>();
    inner.set(k, true);
    foodDayIndex.set(name, inner);
  });

  symptoms.forEach((s) => {
    const d = toDate(s.timestamp);
    const k = dayKey(d);
    allDays.add(k);
    if (d.getTime() < minMs) minMs = d.getTime();
    if (d.getTime() > maxMs) maxMs = d.getTime();
    const inner = symptomDayIndex.get(s.type) ?? new Map<string, Symptom[]>();
    const list = inner.get(k) ?? [];
    list.push(s);
    inner.set(k, list);
    symptomDayIndex.set(s.type, inner);
  });

  if (minMs === Number.POSITIVE_INFINITY) return [];

  // Fill in any missing days within range so denominators reflect calendar, not just logged days.
  const startDay = new Date(minMs); startDay.setHours(0, 0, 0, 0);
  const endDay = new Date(maxMs); endDay.setHours(0, 0, 0, 0);
  const dayList: string[] = [];
  for (let t = startDay.getTime(); t <= endDay.getTime(); t += DAY_MS) {
    const d = new Date(t);
    dayList.push(dayKey(d));
  }
  const totalDays = dayList.length;
  if (totalDays < 4) return []; // Too little span to trust.

  const results: BayesResult[] = [];
  const lagWindows = INSIGHTS_CONFIG.lagWindowsHours;

  foodDayIndex.forEach((days, food) => {
    if (days.size < INSIGHTS_CONFIG.bayesMinFoodOccurrences) return;

    symptomDayIndex.forEach((symDayMap, symType) => {
      const symDays = symDayMap.size;
      if (symDays < INSIGHTS_CONFIG.bayesMinSymptomDays) return;

      // For each lag pair (lagHours, windowHours), test the window starting at lagHours after a food day.
      // Simplified: bucket lag in 24h increments — symptom-day is N days after food-day.
      for (let lagDays = 0; lagDays <= 3; lagDays++) {
        const lagHours = lagDays * 24;
        // Skip lag values outside config to keep noise down (lagDays 0/1/2/3 ≈ 0/24/48/72h).
        if (!(lagWindows as readonly number[]).includes(lagHours)) continue;

        let foodWithSymptom = 0;
        let foodWithoutSymptom = 0;
        let noFoodWithSymptom = 0;
        let noFoodWithoutSymptom = 0;

        for (const day of dayList) {
          const ateFood = days.has(day);
          // Was a symptom logged `lagDays` later (in the window day+lag)?
          const targetIdx = dayList.indexOf(day) + lagDays;
          if (targetIdx >= dayList.length) continue;
          const targetDay = dayList[targetIdx];
          const hadSymptom = symDayMap.has(targetDay);

          if (ateFood && hadSymptom) foodWithSymptom++;
          else if (ateFood && !hadSymptom) foodWithoutSymptom++;
          else if (!ateFood && hadSymptom) noFoodWithSymptom++;
          else noFoodWithoutSymptom++;
        }

        const foodDaysCount = foodWithSymptom + foodWithoutSymptom;
        const noFoodDaysCount = noFoodWithSymptom + noFoodWithoutSymptom;
        if (foodDaysCount < INSIGHTS_CONFIG.bayesMinFoodOccurrences) continue;
        if (noFoodDaysCount < INSIGHTS_CONFIG.bayesMinFoodOccurrences) continue;

        const pY = foodWithSymptom / foodDaysCount;
        const pN = noFoodWithSymptom / Math.max(1, noFoodDaysCount);
        if (pN === 0 && pY === 0) continue;
        const bf = pN === 0 ? Number.POSITIVE_INFINITY : pY / pN;
        if (bf < INSIGHTS_CONFIG.bayesMinBayesFactor) continue;

        results.push({
          food,
          symptomType: symType,
          lagHours,
          windowHours: 24,
          pSymptomGivenFood: pY,
          pSymptomGivenNoFood: pN,
          bayesFactor: bf,
          foodOccurrences: foodDaysCount,
          symptomDays: symDays,
          totalDays,
        });
      }
    });
  });

  // Convert top Bayes results to Pattern objects. Keep the strongest lag per (food, symptom).
  const dedup = new Map<string, BayesResult>();
  results.forEach((r) => {
    const k = `${r.food}::${r.symptomType}`;
    const existing = dedup.get(k);
    if (!existing || r.bayesFactor > existing.bayesFactor) dedup.set(k, r);
  });

  const patterns: Pattern[] = [];
  dedup.forEach((r) => {
    const lagLabel = r.lagHours === 0 ? 'same day' : `~${r.lagHours}h later`;
    const pct = Math.round((r.pSymptomGivenFood - r.pSymptomGivenNoFood) * 100);
    const confidence: Pattern['confidence'] =
      r.bayesFactor >= 3 && r.foodOccurrences >= 8 ? 'high' :
      r.bayesFactor >= 2.2 && r.foodOccurrences >= 5 ? 'medium' : 'low';
    patterns.push({
      id: crypto.randomUUID(),
      description: `When you ate ${r.food}, ${r.symptomType} appeared ${lagLabel} ${Math.round(r.pSymptomGivenFood * 100)}% of days, versus ${Math.round(r.pSymptomGivenNoFood * 100)}% on other days (×${r.bayesFactor.toFixed(1)} likelier, ${pct}-point gap, n=${r.foodOccurrences} days).`,
      confidence,
      dataPoints: r.foodOccurrences,
      category: 'bayes',
      pattern: {
        symptom: r.symptomType,
        followsFood: r.food,
        timeWindow: lagLabel,
      },
    });
  });

  return patterns;
}
