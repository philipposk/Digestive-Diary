import { FoodLog, Symptom, Pattern } from '@/types';

export function generateInsights(foodLogs: FoodLog[], symptoms: Symptom[]): Pattern[] {
  const insights: Pattern[] = [];

  if (foodLogs.length === 0 || symptoms.length === 0) {
    return insights;
  }

  // Group symptoms by type
  const symptomsByType = new Map<string, Symptom[]>();
  symptoms.forEach((symptom) => {
    if (!symptomsByType.has(symptom.type)) {
      symptomsByType.set(symptom.type, []);
    }
    symptomsByType.get(symptom.type)!.push(symptom);
  });

  // Analyze patterns for each symptom type
  symptomsByType.forEach((symptomList, symptomType) => {
    if (symptomList.length < 2) return; // Need at least 2 occurrences

    // Find linked foods
    const linkedFoods = new Map<string, number>();
    const timeWindows: number[] = [];

    symptomList.forEach((symptom) => {
      if (symptom.linkedFoodId) {
        const foodLog = foodLogs.find((f) => f.id === symptom.linkedFoodId);
        if (foodLog) {
          const symptomTime = symptom.timestamp instanceof Date ? symptom.timestamp : new Date(symptom.timestamp);
          const foodTime = foodLog.timestamp instanceof Date ? foodLog.timestamp : new Date(foodLog.timestamp);
          const hoursBetween = (symptomTime.getTime() - foodTime.getTime()) / (1000 * 60 * 60);
          timeWindows.push(hoursBetween);

          const foodName = foodLog.food.toLowerCase();
          linkedFoods.set(foodName, (linkedFoods.get(foodName) || 0) + 1);
        }
      }
    });

    // Find most common linked food
    let mostCommonFood: string | undefined;
    let maxCount = 0;
    linkedFoods.forEach((count, food) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonFood = food;
      }
    });

    // Calculate average time window
    let avgTimeWindow: string | undefined;
    if (timeWindows.length > 0) {
      const avg = timeWindows.reduce((a, b) => a + b, 0) / timeWindows.length;
      const rounded = Math.round(avg);
      if (rounded >= 1 && rounded <= 12) {
        avgTimeWindow = `${rounded} hours`;
      }
    }

    // Generate insight if we have enough data
    if (mostCommonFood && maxCount >= 2) {
      const confidence = maxCount >= 5 ? 'high' : maxCount >= 3 ? 'medium' : 'low';
      
      let description = `${symptomType} often appears after ${mostCommonFood}`;
      if (avgTimeWindow) {
        description += ` (typically within ${avgTimeWindow})`;
      }
      description += '.';

      insights.push({
        id: crypto.randomUUID(),
        description,
        confidence,
        dataPoints: maxCount,
        pattern: {
          symptom: symptomType,
          followsFood: mostCommonFood,
          timeWindow: avgTimeWindow,
        },
      });
    }

    // Also check for tag-based patterns (e.g., dairy, gluten)
    const tagCounts = new Map<string, number>();
    symptomList.forEach((symptom) => {
      if (symptom.linkedFoodId) {
        const foodLog = foodLogs.find((f) => f.id === symptom.linkedFoodId);
        if (foodLog) {
          foodLog.tags.forEach((tag) => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          });
        }
      }
    });

    tagCounts.forEach((count, tag) => {
      if (count >= 2) {
        const confidence = count >= 6 ? 'high' : count >= 4 ? 'medium' : 'low';
        const existing = insights.find((i) => 
          i.pattern.symptom === symptomType && 
          i.pattern.followsFood?.toLowerCase().includes(tag)
        );
        
        if (!existing) {
          insights.push({
            id: crypto.randomUUID(),
            description: `${symptomType} often appears after foods with ${tag} tag (${count} occurrences).`,
            confidence,
            dataPoints: count,
            pattern: {
              symptom: symptomType,
              followsFood: `foods tagged with ${tag}`,
            },
          });
        }
      }
    });
  });

  return insights.sort((a, b) => {
    // Sort by confidence (high > medium > low), then by data points
    const confOrder = { high: 3, medium: 2, low: 1 };
    const confDiff = confOrder[b.confidence] - confOrder[a.confidence];
    if (confDiff !== 0) return confDiff;
    return b.dataPoints - a.dataPoints;
  });
}

