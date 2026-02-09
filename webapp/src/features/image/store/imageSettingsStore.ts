import { create } from 'zustand';
import {
  imageSettingsApi,
  ImageModelSettings,
} from '@/services/api/imageSettings.api';

interface ImageSettingsState {
  settings: Record<string, ImageModelSettings>;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  fetchAllSettings: () => Promise<void>;
  fetchModelSettings: (modelSlug: string) => Promise<void>;
  updateModelSettings: (modelSlug: string, settings: Partial<ImageModelSettings>) => Promise<void>;
}

export const useImageSettingsStore = create<ImageSettingsState>((set, get) => ({
  settings: {},
  isLoading: false,
  isSaving: false,
  error: null,

  fetchAllSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await imageSettingsApi.getAllSettings();
      set({ settings: data.settings, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchModelSettings: async (modelSlug: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await imageSettingsApi.getModelSettings(modelSlug);
      const current = get().settings;
      set({
        settings: { ...current, [modelSlug]: data.settings },
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  updateModelSettings: async (modelSlug: string, updates: Partial<ImageModelSettings>) => {
    set({ isSaving: true, error: null });
    try {
      const result = await imageSettingsApi.updateModelSettings(modelSlug, updates);
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
