import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { FoodLog, Symptom, Context, Experiment, Realization, ChatMessage, ChatSession, Source, PhotoUpload, ExperimentLog, FastingSettings, MacroGoals, AutoScanSettings } from '@/types';

interface AppState {
  foodLogs: FoodLog[];
  symptoms: Symptom[];
  contexts: Context[];
  experiments: Experiment[];
  realizations: Realization[];
  chatSession: ChatSession | null;
  sources: Source[];
  photoUploads: PhotoUpload[];
  fastingSettings: FastingSettings;
  macroGoals: MacroGoals | null;
  autoScanSettings: AutoScanSettings;
  
  // Actions
  addFoodLog: (log: Omit<FoodLog, 'id' | 'timestamp'>) => void;
  addSymptom: (symptom: Omit<Symptom, 'id' | 'timestamp'>) => void;
  updateSymptom: (id: string, updates: Partial<Symptom>) => void;
  addRealization: (realization: Omit<Realization, 'id' | 'timestamp'>) => void;
  deleteRealization: (id: string) => void;
  addContext: (context: Omit<Context, 'id' | 'timestamp'>) => void;
  addExperiment: (experiment: Omit<Experiment, 'id'>) => void;
  updateExperiment: (id: string, updates: Partial<Experiment>) => void;
  endExperiment: (id: string) => void;
  addExperimentLog: (experimentId: string, log: Omit<ExperimentLog, 'id' | 'timestamp' | 'experimentId'>) => void;
  deleteExperimentLog: (experimentId: string, logId: string) => void;
  deleteFoodLog: (id: string) => void;
  deleteSymptom: (id: string) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChatSession: () => void;
  addSource: (source: Omit<Source, 'id' | 'addedAt'>) => void;
  deleteSource: (id: string) => void;
  updateSource: (id: string, updates: Partial<Source>) => void;
  addPhotoUpload: (upload: Omit<PhotoUpload, 'id' | 'uploadedAt'>) => void;
  deletePhotoUpload: (id: string) => void;
  
  // Bulk operations for sample data
  setFoodLogs: (logs: FoodLog[]) => void;
  setSymptoms: (symptoms: Symptom[]) => void;
  setContexts: (contexts: Context[]) => void;
  setExperiments: (experiments: Experiment[]) => void;
  setRealizations: (realizations: Realization[]) => void;
  setChatSession: (chatSession: ChatSession | null) => void;
  setFastingSettings: (settings: FastingSettings) => void;
  setMacroGoals: (goals: MacroGoals | null) => void;
  setAutoScanSettings: (settings: AutoScanSettings) => void;
}

// Helper function to safely parse dates
const safeDate = (dateStr: any): Date | undefined => {
  if (!dateStr) return undefined;
  if (dateStr instanceof Date) return dateStr;
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? undefined : date;
  } catch {
    return undefined;
  }
};

// Custom storage with Date serialization
const storage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    const str = localStorage.getItem(name);
    if (!str) return null;
    try {
      const parsed = JSON.parse(str);
      if (!parsed?.state) return null;
      
      // Validate and fix all date fields

        // Convert date strings back to Date objects with error handling
        // Filter out any items with invalid dates to prevent errors
        parsed.state.foodLogs = (parsed.state.foodLogs || [])
          .filter((log: any) => log && log.timestamp)
          .map((log: any) => ({
            ...log,
            timestamp: safeDate(log.timestamp) || new Date(),
          }))
          .filter((log: any) => log.timestamp instanceof Date);

        parsed.state.symptoms = (parsed.state.symptoms || [])
          .filter((s: any) => s && s.timestamp)
          .map((s: any) => ({
            ...s,
            timestamp: safeDate(s.timestamp) || new Date(),
            aiAnalysis: s.aiAnalysis && s.aiAnalysis.analysisTimestamp
              ? {
                  ...s.aiAnalysis,
                  analysisTimestamp: safeDate(s.aiAnalysis.analysisTimestamp) || new Date(),
                }
              : s.aiAnalysis,
          }))
          .filter((s: any) => s.timestamp instanceof Date);

        parsed.state.contexts = (parsed.state.contexts || [])
          .filter((c: any) => c && c.timestamp)
          .map((c: any) => ({
            ...c,
            timestamp: safeDate(c.timestamp) || new Date(),
            sleepStartTime: safeDate(c.sleepStartTime),
            sleepEndTime: safeDate(c.sleepEndTime),
          }))
          .filter((c: any) => c.timestamp instanceof Date);

        parsed.state.experiments = (parsed.state.experiments || [])
          .filter((e: any) => e && e.startDate)
          .map((e: any) => ({
            ...e,
            startDate: safeDate(e.startDate) || new Date(),
            endDate: safeDate(e.endDate),
            logs: (e.logs || [])
              .filter((log: any) => log && log.timestamp)
              .map((log: any) => ({
                ...log,
                timestamp: safeDate(log.timestamp) || new Date(),
              }))
              .filter((log: any) => log.timestamp instanceof Date),
          }))
          .filter((e: any) => e.startDate instanceof Date);

        parsed.state.realizations = (parsed.state.realizations || [])
          .filter((r: any) => r && r.timestamp)
          .map((r: any) => ({
            ...r,
            timestamp: safeDate(r.timestamp) || new Date(),
          }))
          .filter((r: any) => r.timestamp instanceof Date);

        parsed.state.sources = (parsed.state.sources || [])
          .filter((s: any) => s && s.addedAt)
          .map((s: any) => ({
            ...s,
            addedAt: safeDate(s.addedAt) || new Date(),
          }))
          .filter((s: any) => s.addedAt instanceof Date);

        parsed.state.photoUploads = (parsed.state.photoUploads || [])
          .filter((p: any) => p && p.uploadedAt)
          .map((p: any) => ({
            ...p,
            uploadedAt: safeDate(p.uploadedAt) || new Date(),
          }))
          .filter((p: any) => p.uploadedAt instanceof Date);

        // Handle fastingSettings dates
        if (parsed.state.fastingSettings) {
          parsed.state.fastingSettings = {
            ...parsed.state.fastingSettings,
            lastMealTime: safeDate(parsed.state.fastingSettings.lastMealTime),
          };
        }

        // Handle autoScanSettings dates
        if (parsed.state.autoScanSettings) {
          parsed.state.autoScanSettings = {
            ...parsed.state.autoScanSettings,
            lastScanTime: safeDate(parsed.state.autoScanSettings.lastScanTime),
          };
        }

        if (parsed.state.chatSession) {
          const validMessages = (parsed.state.chatSession.messages || [])
            .filter((m: any) => m && m.timestamp)
            .map((m: any) => ({
              ...m,
              timestamp: safeDate(m.timestamp) || new Date(),
            }))
            .filter((m: any) => m.timestamp instanceof Date);

          parsed.state.chatSession = {
            ...parsed.state.chatSession,
            createdAt: safeDate(parsed.state.chatSession.createdAt) || new Date(),
            updatedAt: safeDate(parsed.state.chatSession.updatedAt) || new Date(),
            messages: validMessages,
          };
        }

        // Validate that critical date fields are actually Date objects
        // If they're not, something went wrong - return null to reset state
        const hasInvalidDates = 
          parsed.state.foodLogs?.some((log: any) => !(log.timestamp instanceof Date)) ||
          parsed.state.symptoms?.some((s: any) => !(s.timestamp instanceof Date)) ||
          parsed.state.contexts?.some((c: any) => !(c.timestamp instanceof Date));
        
        if (hasInvalidDates) {
          console.warn('Invalid date format detected in localStorage, resetting state');
          // Clear corrupted data
          if (typeof window !== 'undefined') {
            localStorage.removeItem(name);
          }
          return null;
        }

        return JSON.stringify(parsed);
    } catch (error) {
      console.error('Error parsing localStorage data:', error);
      // Clear corrupted localStorage data
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(name);
        } catch (e) {
          // Ignore removal errors
        }
      }
      // Return null to let Zustand use default state
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(name, value);
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(name);
  },
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      foodLogs: [],
      symptoms: [],
      contexts: [],
      experiments: [],
      realizations: [],
      chatSession: null,
      sources: [],
      photoUploads: [],
      fastingSettings: {
        enabled: false,
        fastingWindow: 16,
        eatingWindow: 8,
      },
      macroGoals: null,
      autoScanSettings: {
        enabled: false,
        frequency: 'manual',
        processedPhotos: [],
      },

      addFoodLog: (log) => {
        const newLog: FoodLog = {
          ...log,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        };
        set((state) => ({
          foodLogs: [...state.foodLogs, newLog].sort(
            (a, b) => {
              const aTime = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
              const bTime = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
              return bTime.getTime() - aTime.getTime();
            }
          ),
        }));
      },

      addSymptom: (symptom) => {
        const newSymptom: Symptom = {
          ...symptom,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        };
        set((state) => ({
          symptoms: [...state.symptoms, newSymptom].sort(
            (a, b) => {
              const aTime = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
              const bTime = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
              return bTime.getTime() - aTime.getTime();
            }
          ),
        }));
      },

      updateSymptom: (id, updates) => {
        set((state) => ({
          symptoms: state.symptoms.map((symptom) =>
            symptom.id === id ? { ...symptom, ...updates } : symptom
          ),
        }));
      },

      addContext: (context) => {
        const newContext: Context = {
          ...context,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        };
        set((state) => ({
          contexts: [...state.contexts, newContext].sort(
            (a, b) => {
              const aTime = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
              const bTime = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
              return bTime.getTime() - aTime.getTime();
            }
          ),
        }));
      },

      addExperiment: (experiment) => {
        const newExperiment: Experiment = {
          ...experiment,
          id: crypto.randomUUID(),
          logs: experiment.logs || [],
        };
        set((state) => ({
          experiments: [...state.experiments, newExperiment].sort(
            (a, b) => {
              const aTime = a.startDate instanceof Date ? a.startDate : new Date(a.startDate);
              const bTime = b.startDate instanceof Date ? b.startDate : new Date(b.startDate);
              return bTime.getTime() - aTime.getTime();
            }
          ),
        }));
      },

      updateExperiment: (id, updates) => {
        set((state) => ({
          experiments: state.experiments.map((exp) =>
            exp.id === id ? { ...exp, ...updates } : exp
          ),
        }));
      },

      addExperimentLog: (experimentId, log) => {
        const newLog: ExperimentLog = {
          ...log,
          experimentId,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        };
        set((state) => ({
          experiments: state.experiments.map((exp) =>
            exp.id === experimentId
              ? { ...exp, logs: [...(exp.logs || []), newLog].sort(
                  (a, b) => {
                    const aTime = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
                    const bTime = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
                    return bTime.getTime() - aTime.getTime();
                  }
                ) }
              : exp
          ),
        }));
      },

      deleteExperimentLog: (experimentId, logId) => {
        set((state) => ({
          experiments: state.experiments.map((exp) =>
            exp.id === experimentId
              ? { ...exp, logs: (exp.logs || []).filter((log) => log.id !== logId) }
              : exp
          ),
        }));
      },

      endExperiment: (id) => {
        set((state) => ({
          experiments: state.experiments.map((exp) =>
            exp.id === id ? { ...exp, active: false, endDate: new Date() } : exp
          ),
        }));
      },

      deleteFoodLog: (id) => {
        set((state) => ({
          foodLogs: state.foodLogs.filter((log) => log.id !== id),
        }));
      },

      deleteSymptom: (id) => {
        set((state) => ({
          symptoms: state.symptoms.filter((symptom) => symptom.id !== id),
        }));
      },

      addRealization: (realization) => {
        const newRealization: Realization = {
          ...realization,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        };
        set((state) => ({
          realizations: [...state.realizations, newRealization].sort(
            (a, b) => {
              const aTime = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
              const bTime = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
              return bTime.getTime() - aTime.getTime();
            }
          ),
        }));
      },

      deleteRealization: (id) => {
        set((state) => ({
          realizations: state.realizations.filter((r) => r.id !== id),
        }));
      },

      addChatMessage: (message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        };
        set((state) => {
          const now = new Date();
          if (!state.chatSession) {
            // Create new chat session
            return {
              chatSession: {
                id: crypto.randomUUID(),
                messages: [newMessage],
                createdAt: now,
                updatedAt: now,
              },
            };
          } else {
            // Add to existing session
            return {
              chatSession: {
                ...state.chatSession,
                messages: [...state.chatSession.messages, newMessage],
                updatedAt: now,
              },
            };
          }
        });
      },

      clearChatSession: () => {
        set({ chatSession: null });
      },

      addSource: (source) => {
        const newSource: Source = {
          ...source,
          id: crypto.randomUUID(),
          addedAt: new Date(),
        };
        set((state) => ({
          sources: [...state.sources, newSource].sort(
            (a, b) => {
              const aTime = a.addedAt instanceof Date ? a.addedAt : new Date(a.addedAt);
              const bTime = b.addedAt instanceof Date ? b.addedAt : new Date(b.addedAt);
              return bTime.getTime() - aTime.getTime();
            }
          ),
        }));
      },

      deleteSource: (id) => {
        set((state) => ({
          sources: state.sources.filter((s) => s.id !== id),
        }));
      },

      updateSource: (id, updates) => {
        set((state) => ({
          sources: state.sources.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },

      addPhotoUpload: (upload) => {
        const newUpload: PhotoUpload = {
          ...upload,
          id: crypto.randomUUID(),
          uploadedAt: new Date(),
        };
        set((state) => ({
          photoUploads: [...state.photoUploads, newUpload].sort(
            (a, b) => {
              const aTime = a.uploadedAt instanceof Date ? a.uploadedAt : new Date(a.uploadedAt);
              const bTime = b.uploadedAt instanceof Date ? b.uploadedAt : new Date(b.uploadedAt);
              return bTime.getTime() - aTime.getTime();
            }
          ),
        }));
      },

      deletePhotoUpload: (id) => {
        set((state) => ({
          photoUploads: state.photoUploads.filter((p) => p.id !== id),
        }));
      },

      setFoodLogs: (logs) => set({ foodLogs: logs }),
      setSymptoms: (symptoms) => set({ symptoms }),
      setContexts: (contexts) => set({ contexts }),
      setExperiments: (experiments) => set({ experiments }),
      setRealizations: (realizations) => set({ realizations }),
      setChatSession: (chatSession) => set({ chatSession }),
      setFastingSettings: (settings) => set({ fastingSettings: settings }),
      setMacroGoals: (goals) => set({ macroGoals: goals }),
      setAutoScanSettings: (settings) => set({ autoScanSettings: settings }),
    }),
    {
      name: 'digestive-diary-storage',
      storage: createJSONStorage(() => storage),
    }
  )
);
