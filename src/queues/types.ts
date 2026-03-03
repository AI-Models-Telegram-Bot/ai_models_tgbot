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
  inputImageUrls?: string[]; // Image URLs for image-to-video generation
  inputVideoUrl?: string; // Video URL for Kling Motion Control
  inputAudioUrl?: string; // Audio URL for Kling AI Avatar
  modelName?: string; // Display name (e.g. "Seedance 1.5", "Kling")
  telegramId?: number; // User's Telegram ID (for webapp settings URL)
  settingsApplied?: Record<string, unknown>; // Snapshot of settings at enqueue time
  source?: 'telegram' | 'web' | 'bot_chat'; // Origin of the request
  webMessageId?: string; // ChatMessage ID for web/bot_chat delivery
  trendGenerationId?: string; // Links to TrendGeneration record for trend video generation
}

export interface GenerationJobResult {
  requestId: string;
  success: boolean;
  error?: string;
}
