import apiClient from './client';

export interface VideoModelSettings {
  aspectRatio?: string;
  duration?: number;
  resolution?: string;
  generateAudio?: boolean;
}

export interface VideoSettingsResponse {
  settings: Record<string, VideoModelSettings>;
}

export interface VideoModelSettingsResponse {
  settings: VideoModelSettings;
}

export const videoSettingsApi = {
  getAllSettings: (): Promise<VideoSettingsResponse> =>
    apiClient.get('/video-settings/me').then(r => r.data),

  getModelSettings: (modelSlug: string): Promise<VideoModelSettingsResponse> =>
    apiClient.get(`/video-settings/me/${modelSlug}`).then(r => r.data),

  updateModelSettings: (modelSlug: string, settings: Partial<VideoModelSettings>): Promise<{ success: boolean; settings: VideoModelSettings }> =>
    apiClient.put('/video-settings/me', { modelSlug, settings }).then(r => r.data),
};
