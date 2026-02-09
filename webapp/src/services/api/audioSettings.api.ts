import apiClient from './client';

export interface ElevenLabsSettings {
  voiceId: string;
  voiceName: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
}

export interface SunoSettings {
  mode: 'custom' | 'standard' | 'instrumental';
  style: string;
}

export interface SoundGenSettings {
  textTemp: number;
  waveformTemp: number;
}

export interface VoiceCloningSettings {
  model: 'xtts-v2' | 'fish-speech';
}

export interface AudioSettingsResponse {
  elevenLabsSettings: ElevenLabsSettings;
  sunoSettings: SunoSettings;
  soundGenSettings: SoundGenSettings;
  voiceCloningSettings: VoiceCloningSettings;
}

export interface VoiceInfo {
  voiceId: string;
  name: string;
  category: string;
  previewUrl: string | null;
  labels: Record<string, string>;
  description: string | null;
}

export const audioSettingsApi = {
  getSettings: (): Promise<AudioSettingsResponse> =>
    apiClient.get('/audio-settings/me').then(r => r.data),

  updateSettings: (func: string, settings: Record<string, unknown>): Promise<{ success: boolean }> =>
    apiClient.put('/audio-settings/me', { function: func, settings }).then(r => r.data),

  getVoices: (params?: { search?: string; category?: string }): Promise<{ voices: VoiceInfo[]; total: number }> =>
    apiClient.get('/audio/voices', { params }).then(r => r.data),
};
