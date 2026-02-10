import { create } from 'zustand';
import {
  videoSettingsApi,
  VideoModelSettings,
} from '@/services/api/videoSettings.api';

interface VideoSettingsState {
  settings: Record<string, VideoModelSettings>;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  fetchAllSettings: () => Promise<void>;
  fetchModelSettings: (modelSlug: string) => Promise<void>;
  updateModelSettings: (modelSlug: string, settings: Partial<VideoModelSettings>) => Promise<void>;
}

export const useVideoSettingsStore = create<VideoSettingsState>((set, get) => ({
  settings: {},
  isLoading: false,
  isSaving: false,
  error: null,

  fetchAllSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await videoSettingsApi.getAllSettings();
      set({ settings: data.settings, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchModelSettings: async (modelSlug: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await videoSettingsApi.getModelSettings(modelSlug);
      const current = get().settings;
      set({
        settings: { ...current, [modelSlug]: data.settings },
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  updateModelSettings: async (modelSlug: string, updates: Partial<VideoModelSettings>) => {
    set({ isSaving: true, error: null });
    try {
      const result = await videoSettingsApi.updateModelSettings(modelSlug, updates);
      const current = get().settings;
      set({
        settings: { ...current, [modelSlug]: result.settings },
        isSaving: false,
      });
    } catch (err: any) {
      set({ error: err.message, isSaving: false });
      throw err;
    }
  },
}));
