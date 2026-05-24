export const INSIGHTS_CONFIG = {
  symptomFoodWindowHours: 12,
  bingeWindowHours: 3,
  bingeMinLogs: 3,
  bingeRequireSugarTag: true,
  sugarCravingResponseMinutes: 60,
  minOccurrencesForPattern: 2,
  experimentMinDurationDays: 3,
  experimentMinDataPoints: 3,
  experimentSignificantChange: 0.3,
  weeklyTrendMinWeeks: 4,
  weeklyTrendSignificantChange: 0.3,
} as const;

export type InsightsConfig = typeof INSIGHTS_CONFIG;
