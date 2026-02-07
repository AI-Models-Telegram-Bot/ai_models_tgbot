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

  fetchSettings: (telegramId: string) => Promise<void>;
  updateElevenLabs: (telegramId: string, settings: Partial<ElevenLabsSettings>) => Promise<void>;
  updateSuno: (telegramId: string, settings: Partial<SunoSettings>) => Promise<void>;
  updateSoundGen: (telegramId: string, settings: Partial<SoundGenSettings>) => Promise<void>;
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

  fetchSettings: async (telegramId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await audioSettingsApi.getSettings(telegramId);
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

  updateElevenLabs: async (telegramId: string, settings: Partial<ElevenLabsSettings>) => {
    set({ isSaving: true, error: null });
    try {
      await audioSettingsApi.updateSettings(telegramId, 'elevenlabs', settings);
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

  updateSuno: async (telegramId: string, settings: Partial<SunoSettings>) => {
    set({ isSaving: true, error: null });
    try {
      await audioSettingsApi.updateSettings(telegramId, 'suno', settings);
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

  updateSoundGen: async (telegramId: string, settings: Partial<SoundGenSettings>) => {
    set({ isSaving: true, error: null });
    try {
      await audioSettingsApi.updateSettings(telegramId, 'soundGen', settings);
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
    set({ voicesLoading: true });
    try {
      const data = await audioSettingsApi.getVoices({ search, category });
      set({ voices: data.voices, voicesLoading: false });
    } catch (err: any) {
      set({ voicesLoading: false, error: err.message });
    }
  },
}));
