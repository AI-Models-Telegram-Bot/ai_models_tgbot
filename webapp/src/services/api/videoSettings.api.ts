import apiClient from './client';

export interface VideoModelSettings {
  aspectRatio?: string;
  duration?: number;
  resolution?: string;
  generateAudio?: boolean;
  version?: string;
  negativePrompt?: string;
  cfgScale?: number;
  enableAudio?: boolean;
  mode?: string;
  cameraFixed?: boolean;
  qualityMode?: string;
  sound?: boolean;
  characterOrientation?: string;
  // Topaz AI fields
  upscale?: string;
  // Topaz AI Pro (Direct API) fields
  topazModel?: string;
  topazFpsModel?: string;
  targetFps?: number;
  compression?: number;
  details?: number;
  noise?: number;
  halo?: number;
  blur?: number;
  grain?: number;
  grainSize?: number;
  recoverOriginalDetail?: number;
  // WaveSpeed fields
  targetResolution?: string;
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
