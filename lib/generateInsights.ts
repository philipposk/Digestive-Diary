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
    const foodOccurrences = new Map<string, Array<{ symptomId: string; foodLogId: string; hoursBetween: number }>>();

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
          
          // Track occurrences
          if (!foodOccurrences.has(foodName)) {
            foodOccurrences.set(foodName, []);
          }
          foodOccurrences.get(foodName)!.push({
            symptomId: symptom.id,
            foodLogId: foodLog.id,
            hoursBetween: Math.round(hoursBetween * 10) / 10, // Round to 1 decimal
          });
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
        occurrences: foodOccurrences.get(mostCommonFood) || [],
      });
    }

    // Also check for tag-based patterns (e.g., dairy, gluten)
    const tagCounts = new Map<string, number>();
    const tagOccurrences = new Map<string, Array<{ symptomId: string; foodLogId: string; hoursBetween: number }>>();
    
    symptomList.forEach((symptom) => {
      if (symptom.linkedFoodId) {
        const foodLog = foodLogs.find((f) => f.id === symptom.linkedFoodId);
        if (foodLog) {
          const symptomTime = symptom.timestamp instanceof Date ? symptom.timestamp : new Date(symptom.timestamp);
          const foodTime = foodLog.timestamp instanceof Date ? foodLog.timestamp : new Date(foodLog.timestamp);
          const hoursBetween = (symptomTime.getTime() - foodTime.getTime()) / (1000 * 60 * 60);
          
          foodLog.tags.forEach((tag) => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            
            // Track occurrences for tags
            if (!tagOccurrences.has(tag)) {
              tagOccurrences.set(tag, []);
            }
            tagOccurrences.get(tag)!.push({
              symptomId: symptom.id,
              foodLogId: foodLog.id,
              hoursBetween: Math.round(hoursBetween * 10) / 10,
            });
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
            occurrences: tagOccurrences.get(tag) || [],
          });
        }
      }
    });
  });

  // Detect psychological/emotional eating patterns
  // Check for binge eating patterns: multiple large meals in short time
  const foodLogsByDay = new Map<string, FoodLog[]>();
  foodLogs.forEach((log) => {
    const dayKey = new Date(log.timestamp).toDateString();
    if (!foodLogsByDay.has(dayKey)) {
      foodLogsByDay.set(dayKey, []);
    }
    foodLogsByDay.get(dayKey)!.push(log);
  });

  foodLogsByDay.forEach((dayLogs, dayKey) => {
    // Check for multiple eating sessions in a short time (e.g., 3+ meals within 3 hours)
    dayLogs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    for (let i = 0; i < dayLogs.length - 2; i++) {
      const sessionLogs: FoodLog[] = [dayLogs[i]];
      const startTime = dayLogs[i].timestamp.getTime();
      
      for (let j = i + 1; j < dayLogs.length; j++) {
        const timeDiff = (dayLogs[j].timestamp.getTime() - startTime) / (1000 * 60 * 60); // hours
        if (timeDiff <= 3) {
          sessionLogs.push(dayLogs[j]);
        } else {
          break;
        }
      }
      
      // If 3+ food logs within 3 hours, flag as potential binge
      if (sessionLogs.length >= 3) {
        const totalCalories = sessionLogs.reduce((sum, log) => sum + (log.macros?.calories || 0), 0);
        const hasHighSugar = sessionLogs.some(log => 
          log.tags.includes('sugar') || 
          log.food.toLowerCase().includes('sugar') ||
          log.food.toLowerCase().includes('dessert') ||
          log.food.toLowerCase().includes('sweet')
        );
        
        // Check for sugar cravings symptoms during this period
        const sugarCravings = symptoms.filter(s => {
          if (s.type !== 'sugar craving') return false;
          const sTime = s.timestamp.getTime();
          return sTime >= startTime && sTime <= startTime + (3 * 60 * 60 * 1000);
        });
        
        if (hasHighSugar || sugarCravings.length > 0) {
          const existing = insights.find(i => 
            i.description.includes('eating pattern') && 
            i.psychologicalFlag
          );
          
          if (!existing && sessionLogs.length >= 3) {
            insights.push({
              id: crypto.randomUUID(),
              description: `Multiple eating sessions detected within a short time window (${sessionLogs.length} logs within 3 hours). This pattern may indicate emotional or psychological eating behaviors, particularly around sugar/high-sugar foods.`,
              confidence: sessionLogs.length >= 5 ? 'high' : sessionLogs.length >= 4 ? 'medium' : 'low',
              dataPoints: sessionLogs.length,
              psychologicalFlag: true,
              pattern: {
                symptom: 'eating pattern',
                followsFood: 'multiple sessions',
              },
            });
          }
        }
        break; // Only create one insight per day
      }
    }
  });

  // Check for sugar craving patterns
  const sugarCravings = symptoms.filter(s => s.type === 'sugar craving');
  if (sugarCravings.length >= 3) {
    const followedByEating = sugarCravings.filter(craving => {
      const cravingTime = craving.timestamp.getTime();
      return foodLogs.some(log => {
        const logTime = log.timestamp.getTime();
        const timeDiff = (logTime - cravingTime) / (1000 * 60); // minutes
        return timeDiff >= 0 && timeDiff <= 60; // Eating within 1 hour of craving
      });
    });
    
    if (followedByEating.length >= 2) {
      const existing = insights.find(i => 
        i.description.includes('sugar craving') && 
        i.psychologicalFlag
      );
      
      if (!existing) {
        insights.push({
          id: crypto.randomUUID(),
          description: `Sugar cravings are frequently followed by eating (${followedByEating.length} occurrences). This pattern may indicate psychological or emotional connections to sugar consumption.`,
          confidence: followedByEating.length >= 5 ? 'high' : followedByEating.length >= 3 ? 'medium' : 'low',
          dataPoints: followedByEating.length,
          psychologicalFlag: true,
          pattern: {
            symptom: 'sugar craving',
            followsFood: 'eating response',
          },
        });
      }
    }
  }

  return insights.sort((a, b) => {
    // Sort by confidence (high > medium > low), then by data points
    const confOrder = { high: 3, medium: 2, low: 1 };
    const confDiff = confOrder[b.confidence] - confOrder[a.confidence];
    if (confDiff !== 0) return confDiff;
    return b.dataPoints - a.dataPoints;
  });
}

