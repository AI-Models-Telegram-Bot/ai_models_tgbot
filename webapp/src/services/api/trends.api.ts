import apiClient from './client';

export const trendsApi = {
  getTrends: (params?: { category?: string; limit?: number; offset?: number }) =>
    apiClient.get('/trends', { params }).then(r => r.data),

  getTrendById: (id: string) =>
    apiClient.get(`/trends/${id}`).then(r => r.data),

  generateTrendVideo: (id: string, data: { photoUrl: string }) =>
    apiClient.post(`/trends/${id}/generate`, data).then(r => r.data),

  getGenerationStatus: (id: string) =>
    apiClient.get(`/trends/generations/${id}/status`).then(r => r.data),

  uploadPhoto: (formData: FormData) =>
    apiClient.post('/trends/upload-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),
};
