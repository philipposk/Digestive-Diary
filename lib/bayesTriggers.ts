// Bayesian trigger probability + lagged correlation.
// For each canonical food (or tag), compute P(symptom in window | ate food today)
// vs P(symptom in window | did NOT eat food today). Report Bayes factor and
// supporting counts. Results are descriptive, never causal.

import { FoodLog, Symptom, Pattern, Medication, MedicationLog, CustomFactor, CustomFactorLog } from '@/types';
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

/**
 * Same Bayes machinery, but the "exposure" variable is a medication being taken
 * on a given day. Surfaces patterns like "Symptoms appear less often on days you
 * take Mebeverine" or "Symptoms appear more often the day after a med dose".
 *
 * Direction matters: bayesFactor > 1 means symptom is MORE likely on med days
 * (potentially worth discussing with clinician); < 1 means less likely.
 */
export function computeMedicationBayes(
  medications: Medication[],
  medicationLogs: MedicationLog[],
  symptoms: Symptom[]
): Pattern[] {
  if (medicationLogs.length === 0 || symptoms.length === 0) return [];
  const patterns: Pattern[] = [];

  // Build medication-day index.
  const medDayIndex = new Map<string, Map<string, true>>();
  const symptomDayIndex = new Map<string, Map<string, true>>();
  let minMs = Number.POSITIVE_INFINITY, maxMs = Number.NEGATIVE_INFINITY;
  const allDays = new Set<string>();

  const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const toD = (v: Date | string) => (v instanceof Date ? v : new Date(v));

  medicationLogs.forEach((l) => {
    const d = toD(l.timestamp);
    if (d.getTime() < minMs) minMs = d.getTime();
    if (d.getTime() > maxMs) maxMs = d.getTime();
    const k = dayKey(d);
    allDays.add(k);
    const inner = medDayIndex.get(l.medicationId) ?? new Map();
    inner.set(k, true);
    medDayIndex.set(l.medicationId, inner);
  });
  symptoms.forEach((s) => {
    const d = toD(s.timestamp);
    if (d.getTime() < minMs) minMs = d.getTime();
    if (d.getTime() > maxMs) maxMs = d.getTime();
    const k = dayKey(d);
    allDays.add(k);
    const inner = symptomDayIndex.get(s.type) ?? new Map();
    inner.set(k, true);
    symptomDayIndex.set(s.type, inner);
  });

  if (minMs === Number.POSITIVE_INFINITY) return [];
  const startDay = new Date(minMs); startDay.setHours(0, 0, 0, 0);
  const endDay = new Date(maxMs); endDay.setHours(0, 0, 0, 0);
  const dayList: string[] = [];
  const DAY = 86_400_000;
  for (let t = startDay.getTime(); t <= endDay.getTime(); t += DAY) {
    dayList.push(dayKey(new Date(t)));
  }
  if (dayList.length < 5) return [];

  medDayIndex.forEach((medDays, medId) => {
    if (medDays.size < INSIGHTS_CONFIG.bayesMinFoodOccurrences) return;
    const med = medications.find((m) => m.id === medId);
    if (!med) return;
    symptomDayIndex.forEach((symDays, symType) => {
      if (symDays.size < INSIGHTS_CONFIG.bayesMinSymptomDays) return;
      let medSym = 0, medNoSym = 0, noMedSym = 0, noMedNoSym = 0;
      for (const day of dayList) {
        const took = medDays.has(day);
        const had = symDays.has(day);
        if (took && had) medSym++;
        else if (took && !had) medNoSym++;
        else if (!took && had) noMedSym++;
        else noMedNoSym++;
      }
      const tookN = medSym + medNoSym;
      const notN = noMedSym + noMedNoSym;
      if (tookN < INSIGHTS_CONFIG.bayesMinFoodOccurrences) return;
      if (notN < INSIGHTS_CONFIG.bayesMinFoodOccurrences) return;
      const pY = medSym / tookN;
      const pN = noMedSym / Math.max(1, notN);
      if (pY === 0 && pN === 0) return;
      const bf = pN === 0 ? Number.POSITIVE_INFINITY : pY / pN;
      if (bf >= INSIGHTS_CONFIG.bayesMinBayesFactor || bf <= 1 / INSIGHTS_CONFIG.bayesMinBayesFactor) {
        const direction = bf > 1 ? 'more often' : 'less often';
        const confidence: Pattern['confidence'] = tookN >= 8 && (bf >= 3 || bf <= 1 / 3) ? 'high'
          : tookN >= 5 ? 'medium' : 'low';
        patterns.push({
          id: crypto.randomUUID(),
          description: `${symType} appears ${direction} on days you took ${med.name} (${Math.round(pY * 100)}% vs ${Math.round(pN * 100)}%, n=${tookN} days).`,
          confidence,
          dataPoints: tookN,
          category: 'medication',
          pattern: { symptom: symType, followsFood: `medication: ${med.name}` },
        });
      }
    });
  });

  return patterns;
}

/**
 * Threshold a custom factor (severity / number) at its median, then compute Bayes
 * the same way. For yes/no factors, log-value === 1 is the exposure.
 */
export function computeFactorBayes(
  factors: CustomFactor[],
  factorLogs: CustomFactorLog[],
  symptoms: Symptom[]
): Pattern[] {
  if (factorLogs.length === 0 || symptoms.length === 0) return [];
  const patterns: Pattern[] = [];
  const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const toD = (v: Date | string) => (v instanceof Date ? v : new Date(v));

  const symDays = new Map<string, Map<string, true>>();
  symptoms.forEach((s) => {
    const k = dayKey(toD(s.timestamp));
    const inner = symDays.get(s.type) ?? new Map<string, true>();
    inner.set(k, true);
    symDays.set(s.type, inner);
  });

  factors.forEach((f) => {
    const myLogs = factorLogs.filter((l) => l.factorId === f.id);
    if (myLogs.length < INSIGHTS_CONFIG.bayesMinFoodOccurrences) return;

    // Compute threshold.
    let threshold: number;
    if (f.scale === 'yesno') threshold = 0.5;
    else if (f.scale === 'severity') threshold = 5;
    else {
      const sorted = myLogs.map((l) => l.value).sort((a, b) => a - b);
      threshold = sorted[Math.floor(sorted.length / 2)];
    }

    const highDays = new Set<string>();
    const allDays = new Set<string>();
    myLogs.forEach((l) => {
      const k = dayKey(toD(l.timestamp));
      allDays.add(k);
      if (l.value >= threshold) highDays.add(k);
    });
    if (highDays.size < INSIGHTS_CONFIG.bayesMinFoodOccurrences) return;

    symDays.forEach((sdays, symType) => {
      if (sdays.size < INSIGHTS_CONFIG.bayesMinSymptomDays) return;
      let hiSym = 0, hiNo = 0, loSym = 0, loNo = 0;
      allDays.forEach((day) => {
        const high = highDays.has(day);
        const had = sdays.has(day);
        if (high && had) hiSym++;
        else if (high && !had) hiNo++;
        else if (!high && had) loSym++;
        else loNo++;
      });
      const hiN = hiSym + hiNo;
      const loN = loSym + loNo;
      if (hiN < INSIGHTS_CONFIG.bayesMinFoodOccurrences) return;
      if (loN < INSIGHTS_CONFIG.bayesMinFoodOccurrences) return;
      const pY = hiSym / hiN;
      const pN = loSym / Math.max(1, loN);
      if (pY === 0 && pN === 0) return;
      const bf = pN === 0 ? Number.POSITIVE_INFINITY : pY / pN;
      if (bf >= INSIGHTS_CONFIG.bayesMinBayesFactor || bf <= 1 / INSIGHTS_CONFIG.bayesMinBayesFactor) {
        const dir = bf > 1 ? 'more often' : 'less often';
        const cmp = f.scale === 'yesno' ? `${f.label} = yes` : `${f.label} ≥ ${threshold}${f.unit ? ` ${f.unit}` : ''}`;
        patterns.push({
          id: crypto.randomUUID(),
          description: `${symType} appears ${dir} when ${cmp} (${Math.round(pY * 100)}% vs ${Math.round(pN * 100)}%, n=${hiN} days).`,
          confidence: hiN >= 8 ? 'high' : hiN >= 5 ? 'medium' : 'low',
          dataPoints: hiN,
          category: 'factor',
          pattern: { symptom: symType, followsFood: `factor: ${f.label}` },
        });
      }
    });
  });

  return patterns;
}
