import { create } from 'zustand';
import {
  audioSettingsApi,
  ElevenLabsSettings,
  SunoSettings,
  SoundGenSettings,
  VoiceInfo,
} from '@/services/api/audioSettings.api';

interface AudioSettingsState {
  elevenLabsSettings: ElevenLabsSettings | null;
  sunoSettings: SunoSettings | null;
  soundGenSettings: SoundGenSettings | null;
  voices: VoiceInfo[];
  voicesLoading: boolean;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  fetchSettings: () => Promise<void>;
  updateElevenLabs: (settings: Partial<ElevenLabsSettings>) => Promise<void>;
  updateSuno: (settings: Partial<SunoSettings>) => Promise<void>;
  updateSoundGen: (settings: Partial<SoundGenSettings>) => Promise<void>;
  fetchVoices: (search?: string, category?: string) => Promise<void>;
}

export const useAudioSettingsStore = create<AudioSettingsState>((set, get) => ({
  elevenLabsSettings: null,
  sunoSettings: null,
  soundGenSettings: null,
  voices: [],
  voicesLoading: false,
  isLoading: false,
  isSaving: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await audioSettingsApi.getSettings();
      set({
        elevenLabsSettings: data.elevenLabsSettings,
        sunoSettings: data.sunoSettings,
        soundGenSettings: data.soundGenSettings,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  updateElevenLabs: async (settings: Partial<ElevenLabsSettings>) => {
    set({ isSaving: true, error: null });
    try {
      await audioSettingsApi.updateSettings('elevenlabs', settings);
      const current = get().elevenLabsSettings;
      set({
        elevenLabsSettings: { ...current!, ...settings },
        isSaving: false,
      });
    } catch (err: any) {
      set({ error: err.message, isSaving: false });
      throw err;
    }
  },

  updateSuno: async (settings: Partial<SunoSettings>) => {
    set({ isSaving: true, error: null });
    try {
      await audioSettingsApi.updateSettings('suno', settings);
      const current = get().sunoSettings;
      set({
        sunoSettings: { ...current!, ...settings } as SunoSettings,
        isSaving: false,
      });
    } catch (err: any) {
      set({ error: err.message, isSaving: false });
      throw err;
    }
  },

  updateSoundGen: async (settings: Partial<SoundGenSettings>) => {
    set({ isSaving: true, error: null });
    try {
      await audioSettingsApi.updateSettings('soundGen', settings);
      const current = get().soundGenSettings;
      set({
        soundGenSettings: { ...current!, ...settings } as SoundGenSettings,
        isSaving: false,
      });
    } catch (err: any) {
      set({ error: err.message, isSaving: false });
      throw err;
    }
  },

  fetchVoices: async (search?: string, category?: string) => {
    set({ voicesLoading: true, error: null });
    try {
      const data = await audioSettingsApi.getVoices({ search, category });
      set({ voices: data?.voices || [], voicesLoading: false });
    } catch (err: any) {
      console.error('[AudioStore] fetchVoices error:', err);
      set({ voicesLoading: false, voices: [], error: err.message || 'Failed to fetch voices' });
    }
  },
}));
