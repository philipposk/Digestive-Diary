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
  // Bayesian / lag analysis
  lagWindowsHours: [0, 6, 24, 48, 72] as const,
  bayesMinFoodOccurrences: 4,
  bayesMinSymptomDays: 3,
  bayesMinBayesFactor: 1.8,
} as const;

export type InsightsConfig = typeof INSIGHTS_CONFIG;
