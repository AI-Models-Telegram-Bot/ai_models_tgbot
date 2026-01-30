export interface GenerationJobData {
  requestId: string;
  userId: string;
  chatId: number;
  modelSlug: string;
  modelCategory: string; // TEXT | IMAGE | VIDEO | AUDIO
  provider: string;
  input: string;
  processingMsgId: number;
  language: string; // en | ru
  creditsCost: number;
  priceItemCode: string;
  walletCategory: string; // TEXT | IMAGE | VIDEO | AUDIO
}

export interface GenerationJobResult {
  requestId: string;
  success: boolean;
  error?: string;
}
