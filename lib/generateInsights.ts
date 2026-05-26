import { FoodLog, Symptom, Pattern, Experiment, Medication, MedicationLog, CustomFactor, CustomFactorLog } from '@/types';
import { INSIGHTS_CONFIG } from './insightsConfig';
import { canonicalizeFoodNames, foodKey } from './foodNormalize';
import { computeBayesTriggers, computeMedicationBayes, computeFactorBayes } from './bayesTriggers';

function toDate(t: Date | string | undefined): Date {
  return t instanceof Date ? t : new Date(t || 0);
}

interface FoodSymptomOccurrence {
  symptomId: string;
  foodLogId: string;
  hoursBetween: number;
}

function generateFoodSymptomPatterns(
  foodLogs: FoodLog[],
  symptoms: Symptom[],
  foodCanonical: Map<string, string>
): Pattern[] {
  const insights: Pattern[] = [];

  const symptomsByType = new Map<string, Symptom[]>();
  symptoms.forEach((s) => {
    const list = symptomsByType.get(s.type) ?? [];
    list.push(s);
    symptomsByType.set(s.type, list);
  });

  symptomsByType.forEach((symptomList, symptomType) => {
    if (symptomList.length < INSIGHTS_CONFIG.minOccurrencesForPattern) return;

    const linkedCounts = new Map<string, number>();
    const linkedOccurrences = new Map<string, FoodSymptomOccurrence[]>();
    const timeWindows: number[] = [];

    const tagCounts = new Map<string, number>();
    const tagOccurrences = new Map<string, FoodSymptomOccurrence[]>();

    symptomList.forEach((symptom) => {
      if (!symptom.linkedFoodId) return;
      const foodLog = foodLogs.find((f) => f.id === symptom.linkedFoodId);
      if (!foodLog) return;
      const hoursBetween = (toDate(symptom.timestamp).getTime() - toDate(foodLog.timestamp).getTime()) / 3.6e6;
      if (hoursBetween < 0 || hoursBetween > INSIGHTS_CONFIG.symptomFoodWindowHours) return;

      timeWindows.push(hoursBetween);
      const canonical = foodCanonical.get(foodLog.food) ?? foodKey(foodLog.food);
      linkedCounts.set(canonical, (linkedCounts.get(canonical) ?? 0) + 1);
      const occ: FoodSymptomOccurrence = {
        symptomId: symptom.id,
        foodLogId: foodLog.id,
        hoursBetween: Math.round(hoursBetween * 10) / 10,
      };
      const list = linkedOccurrences.get(canonical) ?? [];
      list.push(occ);
      linkedOccurrences.set(canonical, list);

      (foodLog.tags ?? []).forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
        const tagList = tagOccurrences.get(tag) ?? [];
        tagList.push(occ);
        tagOccurrences.set(tag, tagList);
      });
    });

    let mostCommonFood: string | undefined;
    let maxCount = 0;
    linkedCounts.forEach((count, food) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonFood = food;
      }
    });

    let avgTimeWindow: string | undefined;
    if (timeWindows.length > 0) {
      const avg = timeWindows.reduce((a, b) => a + b, 0) / timeWindows.length;
      const rounded = Math.round(avg);
      if (rounded >= 1 && rounded <= INSIGHTS_CONFIG.symptomFoodWindowHours) {
        avgTimeWindow = `${rounded} hours`;
      }
    }

    if (mostCommonFood && maxCount >= INSIGHTS_CONFIG.minOccurrencesForPattern) {
      const confidence = maxCount >= 5 ? 'high' : maxCount >= 3 ? 'medium' : 'low';
      let description = `${symptomType} is often associated with ${mostCommonFood}`;
      if (avgTimeWindow) description += ` (typically within ${avgTimeWindow})`;
      description += '.';

      insights.push({
        id: crypto.randomUUID(),
        description,
        confidence,
        dataPoints: maxCount,
        category: 'food',
        pattern: {
          symptom: symptomType,
          followsFood: mostCommonFood,
          timeWindow: avgTimeWindow,
        },
        occurrences: linkedOccurrences.get(mostCommonFood) ?? [],
      });
    }

    tagCounts.forEach((count, tag) => {
      if (count < INSIGHTS_CONFIG.minOccurrencesForPattern) return;
      if (mostCommonFood && (mostCommonFood.includes(tag) || tag.includes(mostCommonFood))) return;
      const confidence = count >= 6 ? 'high' : count >= 4 ? 'medium' : 'low';
      insights.push({
        id: crypto.randomUUID(),
        description: `${symptomType} appears after foods tagged "${tag}" (${count} occurrences).`,
        confidence,
        dataPoints: count,
        category: 'tag',
        pattern: {
          symptom: symptomType,
          followsFood: `foods tagged with ${tag}`,
        },
        occurrences: tagOccurrences.get(tag) ?? [],
      });
    });
  });

  return insights;
}

function detectBingePatterns(foodLogs: FoodLog[]): Pattern[] {
  const insights: Pattern[] = [];
  const byDay = new Map<string, FoodLog[]>();
  foodLogs.forEach((log) => {
    const key = toDate(log.timestamp).toDateString();
    const list = byDay.get(key) ?? [];
    list.push(log);
    byDay.set(key, list);
  });

  byDay.forEach((dayLogs) => {
    dayLogs.sort((a, b) => toDate(a.timestamp).getTime() - toDate(b.timestamp).getTime());
    for (let i = 0; i <= dayLogs.length - INSIGHTS_CONFIG.bingeMinLogs; i++) {
      const start = toDate(dayLogs[i].timestamp).getTime();
      const windowEnd = start + INSIGHTS_CONFIG.bingeWindowHours * 3.6e6;
      const sessionLogs: FoodLog[] = [];
      for (let j = i; j < dayLogs.length; j++) {
        if (toDate(dayLogs[j].timestamp).getTime() <= windowEnd) sessionLogs.push(dayLogs[j]);
        else break;
      }
      if (sessionLogs.length < INSIGHTS_CONFIG.bingeMinLogs) continue;
      const sugarLogs = sessionLogs.filter((l) => Array.isArray(l.tags) && l.tags.includes('sugar'));
      if (INSIGHTS_CONFIG.bingeRequireSugarTag && sugarLogs.length < INSIGHTS_CONFIG.bingeMinLogs) continue;

      insights.push({
        id: crypto.randomUUID(),
        description: `Multiple sugar-tagged foods logged within ${INSIGHTS_CONFIG.bingeWindowHours} hours (${sessionLogs.length} entries). This pattern is often associated with emotional or psychological eating.`,
        confidence: sessionLogs.length >= 5 ? 'high' : sessionLogs.length >= 4 ? 'medium' : 'low',
        dataPoints: sessionLogs.length,
        category: 'psychological',
        psychologicalFlag: true,
        pattern: {
          symptom: 'eating pattern',
          followsFood: 'multiple sugar sessions',
        },
      });
      return;
    }
  });

  return insights;
}

function detectSugarCravingPatterns(foodLogs: FoodLog[], symptoms: Symptom[]): Pattern[] {
  const cravings = symptoms.filter((s) => s.type === 'sugar craving');
  if (cravings.length < INSIGHTS_CONFIG.minOccurrencesForPattern) return [];

  const responseMs = INSIGHTS_CONFIG.sugarCravingResponseMinutes * 60_000;
  const followedByEating = cravings.filter((craving) => {
    const cravingMs = toDate(craving.timestamp).getTime();
    return foodLogs.some((log) => {
      const dt = toDate(log.timestamp).getTime() - cravingMs;
      return dt >= 0 && dt <= responseMs;
    });
  });

  if (followedByEating.length < INSIGHTS_CONFIG.minOccurrencesForPattern) return [];

  return [{
    id: crypto.randomUUID(),
    description: `Sugar cravings are frequently followed by eating within ${INSIGHTS_CONFIG.sugarCravingResponseMinutes} minutes (${followedByEating.length} occurrences). This pattern may indicate an emotional connection to sugar.`,
    confidence: followedByEating.length >= 5 ? 'high' : followedByEating.length >= 3 ? 'medium' : 'low',
    dataPoints: followedByEating.length,
    category: 'psychological',
    psychologicalFlag: true,
    pattern: {
      symptom: 'sugar craving',
      followsFood: 'eating response',
    },
  }];
}

export function correlateExperiments(experiments: Experiment[], symptoms: Symptom[]): Pattern[] {
  const results: Pattern[] = [];

  for (const exp of experiments) {
    if (!exp.startDate) continue;
    const start = toDate(exp.startDate).getTime();
    const end = exp.endDate ? toDate(exp.endDate).getTime() : Date.now();
    const durationMs = end - start;
    const durationDays = durationMs / 86_400_000;
    if (durationDays < INSIGHTS_CONFIG.experimentMinDurationDays) continue;

    const baselineStart = start - durationMs;
    const baselineEnd = start;

    const types = new Set(symptoms.map((s) => s.type));
    for (const type of types) {
      const baseline = symptoms.filter((s) => {
        const t = toDate(s.timestamp).getTime();
        return s.type === type && t >= baselineStart && t < baselineEnd;
      });
      const during = symptoms.filter((s) => {
        const t = toDate(s.timestamp).getTime();
        return s.type === type && t >= start && t <= end;
      });

      const totalPoints = baseline.length + during.length;
      if (totalPoints < INSIGHTS_CONFIG.experimentMinDataPoints) continue;

      const baseRate = baseline.length / Math.max(0.5, durationDays);
      const duringRate = during.length / Math.max(0.5, durationDays);
      const baseSev = baseline.length > 0 ? baseline.reduce((a, s) => a + s.severity, 0) / baseline.length : 0;
      const duringSev = during.length > 0 ? during.reduce((a, s) => a + s.severity, 0) / during.length : 0;

      const rateChange = baseRate === 0 ? (duringRate > 0 ? 1 : 0) : (duringRate - baseRate) / baseRate;
      const sevChange = baseSev === 0 ? (duringSev > 0 ? 1 : 0) : (duringSev - baseSev) / baseSev;

      const threshold = INSIGHTS_CONFIG.experimentSignificantChange;
      if (Math.abs(rateChange) < threshold && Math.abs(sevChange) < threshold) continue;

      const avgChange = (rateChange + sevChange) / 2;
      const direction = avgChange < 0 ? 'decreased' : 'increased';
      const rateDeltaPct = Math.round(Math.abs(rateChange) * 100);
      const sevDeltaPct = Math.round(Math.abs(sevChange) * 100);
      const confidence: Pattern['confidence'] =
        totalPoints >= 10 ? 'high' :
        totalPoints >= 5 ? 'medium' : 'low';

      results.push({
        id: crypto.randomUUID(),
        description: `During "${exp.name}", ${type} ${direction}: frequency ${rateDeltaPct}%, severity ${sevDeltaPct}% versus the equivalent prior window. This is an association, not a proven cause.`,
        confidence,
        dataPoints: totalPoints,
        category: 'experiment',
        pattern: {
          symptom: type,
          followsFood: undefined,
        },
      });
    }
  }
  return results;
}

function isoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function detectWeeklyTrends(symptoms: Symptom[]): Pattern[] {
  const minWeeks = INSIGHTS_CONFIG.weeklyTrendMinWeeks;
  if (symptoms.length < minWeeks) return [];

  const byType = new Map<string, Symptom[]>();
  symptoms.forEach((s) => {
    const list = byType.get(s.type) ?? [];
    list.push(s);
    byType.set(s.type, list);
  });

  const out: Pattern[] = [];

  byType.forEach((list, type) => {
    if (list.length < minWeeks) return;
    const weeks = new Map<string, { count: number; sevSum: number }>();
    list.forEach((s) => {
      const key = isoWeekKey(toDate(s.timestamp));
      const cur = weeks.get(key) ?? { count: 0, sevSum: 0 };
      cur.count += 1;
      cur.sevSum += s.severity;
      weeks.set(key, cur);
    });
    if (weeks.size < minWeeks) return;
    const sortedKeys = Array.from(weeks.keys()).sort();
    const lastKey = sortedKeys[sortedKeys.length - 1];
    const trailingKeys = sortedKeys.slice(-minWeeks, -1);
    if (trailingKeys.length === 0) return;

    const last = weeks.get(lastKey)!;
    const trailingTotalCount = trailingKeys.reduce((a, k) => a + (weeks.get(k)?.count ?? 0), 0);
    const trailingTotalSev = trailingKeys.reduce((a, k) => a + (weeks.get(k)?.sevSum ?? 0), 0);
    const trailingCountAvg = trailingTotalCount / trailingKeys.length;
    const trailingTotalSevCount = trailingKeys.reduce((a, k) => a + (weeks.get(k)?.count ?? 0), 0);
    const trailingSevAvg = trailingTotalSevCount > 0 ? trailingTotalSev / trailingTotalSevCount : 0;
    const lastSevAvg = last.count > 0 ? last.sevSum / last.count : 0;

    const countChange = trailingCountAvg === 0 ? 0 : (last.count - trailingCountAvg) / trailingCountAvg;
    const sevChange = trailingSevAvg === 0 ? 0 : (lastSevAvg - trailingSevAvg) / trailingSevAvg;
    const threshold = INSIGHTS_CONFIG.weeklyTrendSignificantChange;

    if (Math.abs(countChange) < threshold && Math.abs(sevChange) < threshold) return;
    const direction = ((countChange + sevChange) / 2) < 0 ? 'lower' : 'higher';
    const totalPoints = last.count + trailingTotalCount;
    const confidence: Pattern['confidence'] = totalPoints >= 12 ? 'high' : totalPoints >= 6 ? 'medium' : 'low';

    out.push({
      id: crypto.randomUUID(),
      description: `${type} is ${direction} this week vs the prior ${trailingKeys.length}-week average (count ${Math.round(Math.abs(countChange) * 100)}%, severity ${Math.round(Math.abs(sevChange) * 100)}%).`,
      confidence,
      dataPoints: totalPoints,
      category: 'trend',
      pattern: {
        symptom: type,
      },
    });
  });

  return out;
}

export function generateInsights(
  foodLogs: FoodLog[],
  symptoms: Symptom[],
  experiments: Experiment[] = [],
  medications: Medication[] = [],
  medicationLogs: MedicationLog[] = [],
  customFactors: CustomFactor[] = [],
  customFactorLogs: CustomFactorLog[] = []
): Pattern[] {
  const insights: Pattern[] = [];
  if (foodLogs.length === 0 && symptoms.length === 0) return insights;

  const foodCanonical = canonicalizeFoodNames(foodLogs.map((f) => f.food));

  insights.push(...generateFoodSymptomPatterns(foodLogs, symptoms, foodCanonical));
  insights.push(...detectBingePatterns(foodLogs));
  insights.push(...detectSugarCravingPatterns(foodLogs, symptoms));
  insights.push(...correlateExperiments(experiments, symptoms));
  insights.push(...detectWeeklyTrends(symptoms));
  insights.push(...computeBayesTriggers(foodLogs, symptoms));
  insights.push(...computeMedicationBayes(medications, medicationLogs, symptoms));
  insights.push(...computeFactorBayes(customFactors, customFactorLogs, symptoms));

  return insights.sort((a, b) => {
    const confOrder = { high: 3, medium: 2, low: 1 } as const;
    const confDiff = confOrder[b.confidence] - confOrder[a.confidence];
    if (confDiff !== 0) return confDiff;
    return b.dataPoints - a.dataPoints;
  });
}
