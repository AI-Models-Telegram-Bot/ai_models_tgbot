import { AIModel, ModelCategory } from '@prisma/client';
import { prisma } from '../config/database';

// Maps model slug to price item code
const SLUG_TO_PRICE: Record<string, string> = {
  'gpt-4o': 'TEXT_GPT4O',
  'gpt-4o-mini': 'TEXT_GPT4O_MINI',
  'claude-haiku': 'TEXT_CLAUDE_HAIKU',
  'claude-sonnet': 'TEXT_CLAUDE_SONNET',
  'claude-sonnet-thinking': 'TEXT_CLAUDE_SONNET_THINKING',
  'claude-opus': 'TEXT_CLAUDE_OPUS',
  'claude-opus-thinking': 'TEXT_CLAUDE_OPUS_THINKING',
  'deep-research': 'TEXT_DEEP_RESEARCH',
  'fast-text': 'TEXT_FAST',
  'grok': 'TEXT_GROK',
  'gemini-flash': 'TEXT_GEMINI_FLASH',
  'gemini-pro': 'TEXT_GEMINI_PRO',
  'deepseek-r1': 'TEXT_DEEPSEEK_R1',
  'llama-4-maverick': 'TEXT_LLAMA4_MAVERICK',
  'dall-e-3': 'IMAGE_DALLE3',
  'dall-e-2': 'IMAGE_DALLE2',
  'flux-pro': 'IMAGE_FLUX_PRO',
  'flux-schnell': 'IMAGE_FLUX_SCHNELL',
  'flux-dev': 'IMAGE_FLUX_DEV',
  'flux-kontext': 'IMAGE_FLUX_KONTEXT',
  'sdxl-lightning': 'IMAGE_SDXL_LIGHTNING',
  'sdxl': 'IMAGE_SDXL',
  'playground-v2-5': 'IMAGE_PLAYGROUND',
  'ideogram': 'IMAGE_IDEOGRAM',
  'kling': 'VIDEO_KLING',
  'kling-pro': 'VIDEO_KLING_PRO',
  'kling-3.0': 'VIDEO_KLING_30',
  'kling-motion': 'VIDEO_KLING_MOTION',
  'kling-avatar-pro': 'VIDEO_KLING_AVATAR_PRO',
  'kling-avatar': 'VIDEO_KLING_AVATAR',
  'luma': 'VIDEO_LUMA',
  'wan': 'VIDEO_WAN',
  'veo-fast': 'VIDEO_VEO_FAST',
  'veo': 'VIDEO_VEO',
  'sora': 'VIDEO_SORA',
  'runway': 'VIDEO_RUNWAY',
  'deepgram-tts': 'AUDIO_DEEPGRAM',
  'openai-tts': 'AUDIO_OPENAI_TTS',
  'elevenlabs-tts': 'AUDIO_ELEVENLABS',
  'suno': 'AUDIO_SUNO',
  'xtts-v2': 'AUDIO_XTTS',
  'bark': 'AUDIO_BARK',
  'midjourney': 'IMAGE_MIDJOURNEY',
  'nano-banana': 'IMAGE_NANO_BANANA',
  'nano-banana-pro': 'IMAGE_NANO_BANANA_PRO',
  'nano-banana-2': 'IMAGE_NANO_BANANA_2',
  'seedream': 'IMAGE_SEEDREAM',
  'seedream-4.5': 'IMAGE_SEEDREAM_45',
  'sora-pro': 'VIDEO_SORA_PRO',
  'runway-gen4': 'VIDEO_RUNWAY_GEN4',
  'seedance': 'VIDEO_SEEDANCE',
  'seedance-lite': 'VIDEO_SEEDANCE_LITE',
  'seedance-1-pro': 'VIDEO_SEEDANCE_PRO',
  'seedance-fast': 'VIDEO_SEEDANCE_FAST',
  'topaz': 'VIDEO_TOPAZ',
  'fish-speech': 'AUDIO_FISH_SPEECH',
};

export class ModelService {
  async getAll(): Promise<AIModel[]> {
    return prisma.aIModel.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getByCategory(category: ModelCategory): Promise<AIModel[]> {
    return prisma.aIModel.findMany({
      where: { category, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getBySlug(slug: string): Promise<AIModel | null> {
    return prisma.aIModel.findUnique({
      where: { slug },
    });
  }

  async getById(id: string): Promise<AIModel | null> {
    return prisma.aIModel.findUnique({
      where: { id },
    });
  }

  /**
   * Get the default (cheapest) model for a category
   */
  async getDefaultByCategory(category: ModelCategory): Promise<AIModel | null> {
    return prisma.aIModel.findFirst({
      where: { category, isActive: true },
      orderBy: { tokenCost: 'asc' }, // Cheapest model first
    });
  }

  /**
   * Get the price item code for a model slug
   */
  getPriceItemCode(slug: string): string {
    return SLUG_TO_PRICE[slug] || slug.toUpperCase().replace(/-/g, '_');
  }

  async seedDefaultModels(): Promise<void> {
    const models: {
      name: string;
      slug: string;
      provider: string;
      category: ModelCategory;
      tokenCost: number;
      priceItemCode: string;
      description: string;
    }[] = [
      // Text models
      { name: 'Fast Text', slug: 'fast-text', provider: 'groq', category: 'TEXT', tokenCost: 0.2, priceItemCode: 'TEXT_FAST', description: 'Llama 3.3 70B — fast & free via Groq' },
      { name: 'Gemini Flash', slug: 'gemini-flash', provider: 'google', category: 'TEXT', tokenCost: 0.2, priceItemCode: 'TEXT_GEMINI_FLASH', description: 'Google Gemini 2.5 Flash — fast & cheap' },
      { name: 'GPT-4o Mini', slug: 'gpt-4o-mini', provider: 'openai', category: 'TEXT', tokenCost: 0.3, priceItemCode: 'TEXT_GPT4O_MINI', description: 'OpenAI GPT-4o Mini - efficient' },
      { name: 'Grok', slug: 'grok', provider: 'xai', category: 'TEXT', tokenCost: 0.3, priceItemCode: 'TEXT_GROK', description: 'xAI Grok model' },
      { name: 'Llama 4 Maverick', slug: 'llama-4-maverick', provider: 'together', category: 'TEXT', tokenCost: 0.3, priceItemCode: 'TEXT_LLAMA4_MAVERICK', description: 'Meta Llama 4 Maverick — latest open-source' },
      { name: 'Claude Haiku 4.5', slug: 'claude-haiku', provider: 'anthropic', category: 'TEXT', tokenCost: 0.5, priceItemCode: 'TEXT_CLAUDE_HAIKU', description: 'Anthropic Claude Haiku — fast & cheap' },
      { name: 'DeepSeek R1', slug: 'deepseek-r1', provider: 'together', category: 'TEXT', tokenCost: 0.5, priceItemCode: 'TEXT_DEEPSEEK_R1', description: 'DeepSeek R1 — open-source reasoning model' },
      { name: 'Gemini Pro', slug: 'gemini-pro', provider: 'google', category: 'TEXT', tokenCost: 0.8, priceItemCode: 'TEXT_GEMINI_PRO', description: 'Google Gemini 2.5 Pro — premium reasoning' },
      { name: 'GPT-4o', slug: 'gpt-4o', provider: 'openai', category: 'TEXT', tokenCost: 0.8, priceItemCode: 'TEXT_GPT4O', description: 'OpenAI GPT-4o - fast and capable' },
      { name: 'Claude Sonnet 4', slug: 'claude-sonnet', provider: 'anthropic', category: 'TEXT', tokenCost: 1, priceItemCode: 'TEXT_CLAUDE_SONNET', description: 'Anthropic Claude Sonnet 4 — balanced' },
      { name: 'Claude Sonnet 💭', slug: 'claude-sonnet-thinking', provider: 'anthropic', category: 'TEXT', tokenCost: 3, priceItemCode: 'TEXT_CLAUDE_SONNET_THINKING', description: 'Claude Sonnet with extended thinking — deeper reasoning' },
      { name: 'Claude Opus 4', slug: 'claude-opus', provider: 'anthropic', category: 'TEXT', tokenCost: 5, priceItemCode: 'TEXT_CLAUDE_OPUS', description: 'Anthropic Claude Opus 4 — most capable' },
      { name: '🔬 Deep Research', slug: 'deep-research', provider: 'anthropic', category: 'TEXT', tokenCost: 5, priceItemCode: 'TEXT_DEEP_RESEARCH', description: 'AI-powered web research — searches, reads, and writes a report' },
      { name: 'Claude Opus 💭', slug: 'claude-opus-thinking', provider: 'anthropic', category: 'TEXT', tokenCost: 12, priceItemCode: 'TEXT_CLAUDE_OPUS_THINKING', description: 'Claude Opus with extended thinking — best reasoning' },

      // Image models
      { name: 'Flux Schnell', slug: 'flux-schnell', provider: 'piapi', category: 'IMAGE', tokenCost: 0.2, priceItemCode: 'IMAGE_FLUX_SCHNELL', description: 'Fast affordable images' },
      { name: 'SDXL Lightning', slug: 'sdxl-lightning', provider: 'replicate', category: 'IMAGE', tokenCost: 0.2, priceItemCode: 'IMAGE_SDXL_LIGHTNING', description: 'Ultra-fast 4-step generation' },
      { name: 'Stable Diffusion XL', slug: 'sdxl', provider: 'replicate', category: 'IMAGE', tokenCost: 0.5, priceItemCode: 'IMAGE_SDXL', description: 'High-quality versatile generation' },
      { name: 'Flux Dev', slug: 'flux-dev', provider: 'runware', category: 'IMAGE', tokenCost: 0.8, priceItemCode: 'IMAGE_FLUX_DEV', description: 'Flux Dev - high-quality generation' },
      { name: 'Playground v2.5', slug: 'playground-v2-5', provider: 'replicate', category: 'IMAGE', tokenCost: 1, priceItemCode: 'IMAGE_PLAYGROUND', description: 'Aesthetic high-quality images' },
      { name: 'Seedream 4.0', slug: 'seedream', provider: 'kieai', category: 'IMAGE', tokenCost: 1.5, priceItemCode: 'IMAGE_SEEDREAM', description: 'ByteDance Seedream 4.0 — high-quality image generation and editing' },
      { name: 'Flux Kontext', slug: 'flux-kontext', provider: 'kieai', category: 'IMAGE', tokenCost: 1.5, priceItemCode: 'IMAGE_FLUX_KONTEXT', description: 'Flux Kontext Pro - context-aware generation' },
      { name: 'Nano Banana', slug: 'nano-banana', provider: 'kieai', category: 'IMAGE', tokenCost: 1.5, priceItemCode: 'IMAGE_NANO_BANANA', description: 'Google Gemini 2.5 Flash — fast and affordable image generation' },
      { name: 'DALL-E 2', slug: 'dall-e-2', provider: 'openai', category: 'IMAGE', tokenCost: 2, priceItemCode: 'IMAGE_DALLE2', description: 'OpenAI DALL-E 2 - fast and affordable' },
      { name: 'Seedream 4.5 Beta', slug: 'seedream-4.5', provider: 'kieai', category: 'IMAGE', tokenCost: 2.5, priceItemCode: 'IMAGE_SEEDREAM_45', description: 'ByteDance Seedream 4.5 Beta — 1K/2K/4K quality (⚡2.5-5)' },
      { name: 'Midjourney', slug: 'midjourney', provider: 'kieai', category: 'IMAGE', tokenCost: 3, priceItemCode: 'IMAGE_MIDJOURNEY', description: 'Midjourney artistic image generation (⚡2-5)' },
      { name: 'DALL-E 3', slug: 'dall-e-3', provider: 'openai', category: 'IMAGE', tokenCost: 3, priceItemCode: 'IMAGE_DALLE3', description: 'OpenAI DALL-E 3 - premium quality' },
      { name: 'Flux Pro', slug: 'flux-pro', provider: 'replicate', category: 'IMAGE', tokenCost: 3, priceItemCode: 'IMAGE_FLUX_PRO', description: 'Flux Pro v1.1 - best quality' },
      { name: 'Nano Banana Pro', slug: 'nano-banana-pro', provider: 'kieai', category: 'IMAGE', tokenCost: 5, priceItemCode: 'IMAGE_NANO_BANANA_PRO', description: 'Google Gemini 3 Pro Image — up to 4K (⚡5-8)' },
      { name: 'Nano Banana 2', slug: 'nano-banana-2', provider: 'kieai', category: 'IMAGE', tokenCost: 2, priceItemCode: 'IMAGE_NANO_BANANA_2', description: 'Google Gemini 3.1 Flash Image — up to 14 refs, 1K/2K/4K (⚡2-4)' },

      // Video models
      { name: 'Seedance 1.0 Lite', slug: 'seedance-lite', provider: 'fal', category: 'VIDEO', tokenCost: 9, priceItemCode: 'VIDEO_SEEDANCE_LITE', description: 'ByteDance Seedance 1.0 Lite — affordable 720p video' },
      { name: 'Seedance 1.0 Fast', slug: 'seedance-fast', provider: 'fal', category: 'VIDEO', tokenCost: 13, priceItemCode: 'VIDEO_SEEDANCE_FAST', description: 'ByteDance Seedance 1.0 Pro Fast — fast 1080p video' },
      { name: 'Seedance 1.5 Pro', slug: 'seedance', provider: 'fal', category: 'VIDEO', tokenCost: 13, priceItemCode: 'VIDEO_SEEDANCE', description: 'ByteDance Seedance 1.5 Pro — latest model' },
      { name: 'Wan 2.1', slug: 'wan', provider: 'replicate', category: 'VIDEO', tokenCost: 15, priceItemCode: 'VIDEO_WAN', description: 'Wan AI video generation' },
      { name: 'Kling', slug: 'kling', provider: 'piapi', category: 'VIDEO', tokenCost: 16, priceItemCode: 'VIDEO_KLING', description: 'Kling video generation (⚡16-144)' },
      { name: 'Runway Gen-4 Turbo', slug: 'runway', provider: 'kieai', category: 'VIDEO', tokenCost: 18, priceItemCode: 'VIDEO_RUNWAY', description: 'Runway Gen-4 Turbo — fast video generation' },
      { name: 'Luma Dream Machine', slug: 'luma', provider: 'replicate', category: 'VIDEO', tokenCost: 24, priceItemCode: 'VIDEO_LUMA', description: 'Luma AI Dream Machine' },
      { name: 'Runway Gen-4', slug: 'runway-gen4', provider: 'kieai', category: 'VIDEO', tokenCost: 24, priceItemCode: 'VIDEO_RUNWAY_GEN4', description: 'Runway Gen-4 — standard quality video' },
      { name: 'Veo Fast', slug: 'veo-fast', provider: 'kieai', category: 'VIDEO', tokenCost: 24, priceItemCode: 'VIDEO_VEO_FAST', description: 'Google Veo 3.1 Fast' },
      { name: 'Kling Pro', slug: 'kling-pro', provider: 'piapi', category: 'VIDEO', tokenCost: 27, priceItemCode: 'VIDEO_KLING_PRO', description: 'Kling Pro — premium quality (⚡27-144)' },
      { name: 'Kling 3.0', slug: 'kling-3.0', provider: 'kieai', category: 'VIDEO', tokenCost: 30, priceItemCode: 'VIDEO_KLING_30', description: 'Kling 3.0 — newest generation with sound & multi-shot (⚡30)' },
      { name: 'Kling Motion', slug: 'kling-motion', provider: 'kieai', category: 'VIDEO', tokenCost: 35, priceItemCode: 'VIDEO_KLING_MOTION', description: 'Kling Motion Control — animate photo with video motion (⚡35)' },
      { name: 'Kling Avatar Pro', slug: 'kling-avatar-pro', provider: 'kieai', category: 'VIDEO', tokenCost: 40, priceItemCode: 'VIDEO_KLING_AVATAR_PRO', description: 'Kling AI Avatar Pro — talking head from photo+audio (⚡40)' },
      { name: 'Kling Avatar', slug: 'kling-avatar', provider: 'kieai', category: 'VIDEO', tokenCost: 25, priceItemCode: 'VIDEO_KLING_AVATAR', description: 'Kling AI Avatar Standard — talking head from photo+audio (⚡25)' },
      { name: 'Sora 2', slug: 'sora', provider: 'kieai', category: 'VIDEO', tokenCost: 30, priceItemCode: 'VIDEO_SORA', description: 'OpenAI Sora 2 text-to-video' },
      { name: 'Seedance 1.0 Pro', slug: 'seedance-1-pro', provider: 'fal', category: 'VIDEO', tokenCost: 35, priceItemCode: 'VIDEO_SEEDANCE_PRO', description: 'ByteDance Seedance 1.0 Pro — highest quality 1080p' },
      { name: 'Sora 2 Pro', slug: 'sora-pro', provider: 'kieai', category: 'VIDEO', tokenCost: 47, priceItemCode: 'VIDEO_SORA_PRO', description: 'OpenAI Sora 2 Pro — premium quality video' },
      { name: 'Veo Quality', slug: 'veo', provider: 'kieai', category: 'VIDEO', tokenCost: 116, priceItemCode: 'VIDEO_VEO', description: 'Google Veo 3.1 Quality — best video quality' },
      { name: 'Topaz AI', slug: 'topaz', provider: 'kieai', category: 'VIDEO', tokenCost: 1, priceItemCode: 'VIDEO_TOPAZ', description: 'Topaz AI video enhancement — upscale, FPS boost, quality (⚡1/sec)' },

      // Audio models
      { name: 'Deepgram TTS', slug: 'deepgram-tts', provider: 'openai', category: 'AUDIO', tokenCost: 0.5, priceItemCode: 'AUDIO_DEEPGRAM', description: 'Text-to-speech via OpenAI TTS' },
      { name: 'Fish Speech', slug: 'fish-speech', provider: 'replicate', category: 'AUDIO', tokenCost: 1, priceItemCode: 'AUDIO_FISH_SPEECH', description: 'Fast voice cloning' },
      { name: 'XTTS v2', slug: 'xtts-v2', provider: 'replicate', category: 'AUDIO', tokenCost: 2, priceItemCode: 'AUDIO_XTTS', description: 'Multilingual voice cloning' },
      { name: 'Bark', slug: 'bark', provider: 'replicate', category: 'AUDIO', tokenCost: 2.5, priceItemCode: 'AUDIO_BARK', description: 'Text-to-speech with emotion' },
      { name: 'OpenAI TTS', slug: 'openai-tts', provider: 'openai', category: 'AUDIO', tokenCost: 2.5, priceItemCode: 'AUDIO_OPENAI_TTS', description: 'OpenAI text-to-speech' },
      { name: 'ElevenLabs TTS', slug: 'elevenlabs-tts', provider: 'elevenlabs', category: 'AUDIO', tokenCost: 4, priceItemCode: 'AUDIO_ELEVENLABS', description: 'Premium text-to-speech' },
      { name: 'Suno', slug: 'suno', provider: 'replicate', category: 'AUDIO', tokenCost: 20, priceItemCode: 'AUDIO_SUNO', description: 'AI music generation' },
    ];

    for (const model of models) {
      await prisma.aIModel.upsert({
        where: { slug: model.slug },
        update: model,
        create: model,
      });
    }
  }
}

export const modelService = new ModelService();
