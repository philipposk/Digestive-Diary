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
  macros?: {
    calories?: number;
    protein?: number; // grams
    carbs?: number; // grams
    fat?: number; // grams
    fiber?: number; // grams
  };
  portionWeight?: number; // grams - estimated from photo
}

export interface Symptom {
  id: string;
  type: string; // e.g., 'bloating', 'pain', 'nausea', 'rash', 'pimple'
  severity: SeverityLevel;
  duration?: string; // e.g., '30 minutes', '2 hours'
  timestamp: Date;
  notes?: string;
  linkedFoodId?: string; // Optional link to a food log that may have caused this
  photoUrl?: string; // URL or base64 data URL for symptom photos (rashes, skin issues, etc.)
  linkedSymptomId?: string; // Link to previous occurrence of same symptom (for evolution tracking)
  aiAnalysis?: {
    description?: string; // AI-generated description of what the photo shows
    suggestion?: string; // AI suggestion (e.g., "Consider consulting a doctor")
    possibleCauses?: string[]; // Possible causes based on food logs
    analysisTimestamp: Date;
  };
}

export interface Context {
  id: string;
  sleepQuality?: SleepQuality;
  sleepDuration?: number; // Hours of sleep (e.g., 7.5)
  sleepStartTime?: Date; // When you went to bed
  sleepEndTime?: Date; // When you woke up
  stressLevel?: StressLevel;
  activityLevel?: ActivityLevel;
  bowelMovement?: boolean;
  bowelType?: BowelType;
  timestamp: Date;
  notes?: string;
}

export interface FastingSettings {
  enabled: boolean;
  fastingWindow: number; // Hours of fasting (e.g., 16)
  eatingWindow: number; // Hours of eating (e.g., 8)
  lastMealTime?: Date; // Last time you ate (to calculate when fasting starts)
  preferredFastingStart?: string; // Preferred time to start fasting (e.g., "20:00")
}

export type ExperimentLogType = 'text' | 'audio' | 'image' | 'video';

export interface ExperimentLog {
  id: string;
  experimentId: string;
  type: ExperimentLogType;
  content: string; // Text content, audio URL, image URL, or video URL
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
  logs?: ExperimentLog[]; // Optional logs for tracking progress
}

export interface TimelineItem {
  id: string;
  type: 'food' | 'symptom' | 'context' | 'experiment';
  data: FoodLog | Symptom | Context | Experiment;
  timestamp: Date;
}

export interface MacroGoals {
  calories?: number;
  protein?: number; // grams
  carbs?: number; // grams
  fat?: number; // grams
  fiber?: number; // grams
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  units?: string;
  privacy: {
    shareData: boolean;
  };
  macroGoals?: MacroGoals; // Daily macro targets
}

export interface Pattern {
  id: string;
  description: string; // Natural language description
  confidence: 'low' | 'medium' | 'high';
  dataPoints: number;
  category?: string; // Optional category for insights
  psychologicalFlag?: boolean; // Flag for patterns that may have psychological/emotional components
  pattern: {
    symptom: string;
    followsFood?: string;
    timeWindow?: string; // e.g., '3-5 hours'
    context?: Partial<Context>;
  };
  occurrences?: Array<{
    symptomId: string;
    foodLogId: string;
    hoursBetween: number;
  }>; // Actual occurrences that contributed to this pattern
}

export interface Realization {
  id: string;
  content: string; // User-written realization/note
  timestamp: Date;
  linkedData?: {
    foodLogIds?: string[];
    symptomIds?: string[];
    experimentId?: string;
  };
  aiOrganized?: string; // AI-organized version (optional)
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export type SourceType = 'book' | 'article' | 'video' | 'pdf' | 'other';

export interface Source {
  id: string;
  title: string;
  type: SourceType;
  url?: string; // For videos, articles
  filePath?: string; // For PDFs, uploaded files
  description?: string;
  author?: string;
  addedAt: Date;
  content?: string; // Extracted/uploaded content for AI to reference
  tags?: string[]; // For categorization
}

export interface PhotoUpload {
  id: string;
  fileUrl: string;
  uploadedAt: Date;
  parsedContent?: string; // OCR/extracted text
  foodLogId?: string; // If converted to food log
}

