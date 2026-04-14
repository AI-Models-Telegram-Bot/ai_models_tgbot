const MODEL_ICONS: Record<string, string> = {
  // Text
  'gpt-4o': '🧠',
  'gpt-4o-mini': '⚡',
  'claude-sonnet': '🎭',
  'grok': '🔮',

  // Image
  'flux-schnell': '⚡',
  'sdxl-lightning': '🌩️',
  'flux-kontext': '🔗',
  'dall-e-2': '🎨',
  'sdxl': '🖼️',
  'playground-v2-5': '🎪',
  'nano-banana-pro': '💎',
  'flux-dev': '🔬',
  'flux-pro': '✨',
  'dall-e-3': '🎨',
  'midjourney': '🖌️',
  'ideogram': '🔤',

  // Video
  'wan': '🌊',
  'kling': '🎬',
  'luma': '💫',
  'kling-pro': '🎥',
  'runway': '🛫',
  'veo-fast': '⚡',
  'sora': '🌀',
  'veo': '🎞️',
  'seedance-2': '🆕',
  'seedance-2-fast': '⚡',

  // Audio
  'deepgram-tts': '🔊',
  'fish-speech': '🐟',
  'xtts-v2': '🗣️',
  'bark': '🐕',
  'openai-tts': '🎙️',
  'elevenlabs-tts': '🎤',
  'suno': '🎵',
};

const CATEGORY_FALLBACK_ICONS: Record<string, string> = {
  TEXT: '💬',
  IMAGE: '🖼️',
  VIDEO: '🎬',
  AUDIO: '🎵',
};

export function getModelIcon(slug: string, category?: string): string {
  return MODEL_ICONS[slug] ?? CATEGORY_FALLBACK_ICONS[category ?? ''] ?? '🤖';
}
