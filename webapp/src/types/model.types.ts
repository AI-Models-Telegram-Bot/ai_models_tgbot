export type ModelCategory = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO';

export interface ModelInfo {
  id: string;
  name: string;
  slug: string;
  creditCost: number | 'unlimited';
  creditRange?: [number, number];
  description?: string;
}

export interface ModelsByCategory {
  VIDEO: ModelInfo[];
  IMAGE: ModelInfo[];
  AUDIO: ModelInfo[];
  TEXT: ModelInfo[];
}

export interface PackageModelsResponse {
  packageId: string;
  packageName: string;
  models: ModelsByCategory;
}
