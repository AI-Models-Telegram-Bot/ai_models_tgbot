import apiClient from './client';

export interface ImageModelSettings {
  aspectRatio?: string;
  quality?: string;
  style?: string;
}

export interface ImageSettingsResponse {
  settings: Record<string, ImageModelSettings>;
}

export interface ImageModelSettingsResponse {
  settings: ImageModelSettings;
}

export const imageSettingsApi = {
  getAllSettings: (): Promise<ImageSettingsResponse> =>
    apiClient.get('/image-settings/me').then(r => r.data),

  getModelSettings: (modelSlug: string): Promise<ImageModelSettingsResponse> =>
    apiClient.get(`/image-settings/me/${modelSlug}`).then(r => r.data),

  updateModelSettings: (modelSlug: string, settings: Partial<ImageModelSettings>): Promise<{ success: boolean; settings: ImageModelSettings }> =>
    apiClient.put('/image-settings/me', { modelSlug, settings }).then(r => r.data),
};
