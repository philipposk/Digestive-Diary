import { FoodLog, Pattern, Symptom } from '@/types';
import { foodKey, foodsOverlap } from './foodNormalize';

export interface SuspectFood {
  foodLogId: string;
  food: string;
  score: number;
  reasons: string[];
  hoursAgo: number;
}

interface RankOptions {
  windowHours?: number;
  topN?: number;
}

export function rankSuspectFoods(
  symptomType: string,
  recentFoodLogs: FoodLog[],
  insights: Pattern[],
  allSymptoms: Symptom[],
  opts: RankOptions = {}
): SuspectFood[] {
  const windowHours = opts.windowHours ?? 48;
  const topN = opts.topN ?? 3;
  const now = Date.now();

  const inWindow = recentFoodLogs.filter((f) => {
    const t = f.timestamp instanceof Date ? f.timestamp.getTime() : new Date(f.timestamp).getTime();
    const hoursAgo = (now - t) / 3.6e6;
    return hoursAgo >= 0 && hoursAgo <= windowHours;
  });
  if (inWindow.length === 0) return [];

  const matchingInsights = insights.filter((p) => p.pattern?.symptom === symptomType);

  return inWindow
    .map((food) => {
      const reasons: string[] = [];
      let score = 0;

      const key = foodKey(food.food);
      const directPattern = matchingInsights.find((p) => {
        const target = p.pattern.followsFood;
        if (!target || target.startsWith('foods tagged with ')) return false;
        return foodsOverlap(target, key) || target.toLowerCase().includes(key);
      });
      if (directPattern) {
        const weight = directPattern.confidence === 'high' ? 50 : directPattern.confidence === 'medium' ? 30 : 15;
        score += weight;
        reasons.push(`Past pattern (${directPattern.dataPoints} ${directPattern.dataPoints === 1 ? 'occurrence' : 'occurrences'})`);
      }

      for (const tag of food.tags ?? []) {
        const tagPattern = matchingInsights.find((p) => p.pattern.followsFood === `foods tagged with ${tag}`);
        if (tagPattern) {
          score += 10;
          reasons.push(`Tag "${tag}" linked`);
        }
      }

      const t = food.timestamp instanceof Date ? food.timestamp.getTime() : new Date(food.timestamp).getTime();
      const hoursAgo = (now - t) / 3.6e6;
      const proximity = Math.max(0, 12 - hoursAgo);
      if (proximity > 0) {
        score += proximity;
        if (hoursAgo <= 6) reasons.push(`Recently eaten (${hoursAgo.toFixed(1)}h ago)`);
      }

      const priorLinkCount = allSymptoms.filter((s) => {
        if (s.type !== symptomType || !s.linkedFoodId) return false;
        const linkedFood = recentFoodLogs.find((f) => f.id === s.linkedFoodId);
        return linkedFood && foodsOverlap(linkedFood.food, food.food);
      }).length;
      if (priorLinkCount > 0) {
        score += priorLinkCount * 5;
        reasons.push(`Linked ${priorLinkCount}× before`);
      }

      return {
        foodLogId: food.id,
        food: food.food,
        score,
        reasons,
        hoursAgo: Math.round(hoursAgo * 10) / 10,
      };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}
