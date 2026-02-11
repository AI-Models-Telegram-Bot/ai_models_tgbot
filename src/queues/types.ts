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
  botToken: string; // Bot token of the originating instance (dev vs prod)
  audioOptions?: Record<string, unknown>; // User audio settings (voiceId, textTemp, etc.)
  imageOptions?: Record<string, unknown>; // User image settings (aspectRatio, quality, style, etc.)
  videoOptions?: Record<string, unknown>; // User video settings (aspectRatio, duration, resolution, etc.)
  source?: 'telegram' | 'web'; // Origin of the request (default: telegram for backward compat)
  webMessageId?: string; // ChatMessage ID for web delivery (only when source='web')
}

export interface GenerationJobResult {
  requestId: string;
  success: boolean;
  error?: string;
}
