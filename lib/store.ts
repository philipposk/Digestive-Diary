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

// Custom storage with Date serialization
const storage = {
  getItem: (name: string): string | null => {
    const str = localStorage.getItem(name);
    if (!str) return null;
    try {
      const parsed = JSON.parse(str);
      if (parsed?.state) {
        // Helper function to safely parse dates
        const safeDate = (dateStr: any): Date | undefined => {
          if (!dateStr) return undefined;
          try {
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? undefined : date;
          } catch {
            return undefined;
          }
        };

        // Convert date strings back to Date objects with error handling
        parsed.state.foodLogs = (parsed.state.foodLogs || []).map((log: any) => ({
          ...log,
          timestamp: safeDate(log.timestamp) || new Date(),
        }));

        parsed.state.symptoms = (parsed.state.symptoms || []).map((s: any) => ({
          ...s,
          timestamp: safeDate(s.timestamp) || new Date(),
          aiAnalysis: s.aiAnalysis
            ? {
                ...s.aiAnalysis,
                analysisTimestamp: safeDate(s.aiAnalysis.analysisTimestamp) || new Date(),
              }
            : undefined,
        }));

        parsed.state.contexts = (parsed.state.contexts || []).map((c: any) => ({
          ...c,
          timestamp: safeDate(c.timestamp) || new Date(),
          sleepStartTime: safeDate(c.sleepStartTime),
          sleepEndTime: safeDate(c.sleepEndTime),
        }));

        parsed.state.experiments = (parsed.state.experiments || []).map((e: any) => ({
          ...e,
          startDate: safeDate(e.startDate) || new Date(),
          endDate: safeDate(e.endDate),
          logs: (e.logs || []).map((log: any) => ({
            ...log,
            timestamp: safeDate(log.timestamp) || new Date(),
          })),
        }));

        parsed.state.realizations = (parsed.state.realizations || []).map((r: any) => ({
          ...r,
          timestamp: safeDate(r.timestamp) || new Date(),
        }));

        parsed.state.sources = (parsed.state.sources || []).map((s: any) => ({
          ...s,
          addedAt: safeDate(s.addedAt) || new Date(),
        }));

        parsed.state.photoUploads = (parsed.state.photoUploads || []).map((p: any) => ({
          ...p,
          uploadedAt: safeDate(p.uploadedAt) || new Date(),
        }));

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
          parsed.state.chatSession = {
            ...parsed.state.chatSession,
            createdAt: safeDate(parsed.state.chatSession.createdAt) || new Date(),
            updatedAt: safeDate(parsed.state.chatSession.updatedAt) || new Date(),
            messages: (parsed.state.chatSession.messages || []).map((m: any) => ({
              ...m,
              timestamp: safeDate(m.timestamp) || new Date(),
            })),
          };
        }
      }
      return JSON.stringify(parsed);
    } catch (error) {
      console.error('Error parsing localStorage data:', error);
      // Return null to let Zustand use default state
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    localStorage.setItem(name, value);
  },
  removeItem: (name: string): void => {
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
            (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
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
            (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
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
            (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
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
            (a, b) => b.startDate.getTime() - a.startDate.getTime()
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
                  (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
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
            (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
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
            (a, b) => b.addedAt.getTime() - a.addedAt.getTime()
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
            (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()
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
