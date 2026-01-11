// Core type definitions for Digestive Diary

export type SeverityLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type SleepQuality = 'poor' | 'ok' | 'good';
export type StressLevel = 'low' | 'medium' | 'high';
export type ActivityLevel = 'none' | 'light' | 'intense';
export type BowelType = 'normal' | 'loose' | 'hard' | 'none';

export interface FoodLog {
  id: string;
  food: string;
  quantity?: string;
  tags: string[]; // e.g., ['dairy', 'gluten', 'spicy']
  timestamp: Date;
  notes?: string;
}

export interface Symptom {
  id: string;
  type: string; // e.g., 'bloating', 'pain', 'nausea'
  severity: SeverityLevel;
  duration?: string; // e.g., '30 minutes', '2 hours'
  timestamp: Date;
  notes?: string;
}

export interface Context {
  id: string;
  sleepQuality?: SleepQuality;
  stressLevel?: StressLevel;
  activityLevel?: ActivityLevel;
  bowelMovement?: boolean;
  bowelType?: BowelType;
  timestamp: Date;
  notes?: string;
}

export interface Experiment {
  id: string;
  name: string; // e.g., 'No Dairy', 'Low FODMAP'
  startDate: Date;
  endDate?: Date;
  active: boolean;
  notes?: string;
}

export interface TimelineItem {
  id: string;
  type: 'food' | 'symptom' | 'context' | 'experiment';
  data: FoodLog | Symptom | Context | Experiment;
  timestamp: Date;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  units?: string;
  privacy: {
    shareData: boolean;
  };
}

export interface Pattern {
  id: string;
  description: string; // Natural language description
  confidence: 'low' | 'medium' | 'high';
  dataPoints: number;
  pattern: {
    symptom: string;
    followsFood?: string;
    timeWindow?: string; // e.g., '3-5 hours'
    context?: Partial<Context>;
  };
}

