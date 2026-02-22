import { rootApiClient } from './client';

export interface UploadResponse {
  fileUrl: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  category: string;
}

export const uploadApi = {
  uploadFile: (
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    return rootApiClient
      .post<UploadResponse>('/api/web/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000, // 2 min for large files
        onUploadProgress: (event) => {
          if (onProgress && event.total) {
            onProgress(Math.round((event.loaded * 100) / event.total));
          }
        },
      })
      .then((r) => r.data);
  },
};
