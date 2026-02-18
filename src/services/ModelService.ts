import { AIModel, ModelCategory } from '@prisma/client';
import { prisma } from '../config/database';

// Maps model slug to price item code
const SLUG_TO_PRICE: Record<string, string> = {
  'gpt-4o': 'TEXT_GPT4O',
  'gpt-4o-mini': 'TEXT_GPT4O_MINI',
  'claude-sonnet': 'TEXT_CLAUDE_SONNET',
  'grok': 'TEXT_GROK',
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
  'nano-banana-pro': 'IMAGE_NANO_BANANA_PRO',
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
      { name: 'GPT-4o', slug: 'gpt-4o', provider: 'openai', category: 'TEXT', tokenCost: 5, priceItemCode: 'TEXT_GPT4O', description: 'OpenAI GPT-4o - fast and capable' },
      { name: 'GPT-4o Mini', slug: 'gpt-4o-mini', provider: 'openai', category: 'TEXT', tokenCost: 3, priceItemCode: 'TEXT_GPT4O_MINI', description: 'OpenAI GPT-4o Mini - efficient' },
      { name: 'Claude Sonnet 4', slug: 'claude-sonnet', provider: 'anthropic', category: 'TEXT', tokenCost: 5, priceItemCode: 'TEXT_CLAUDE_SONNET', description: 'Anthropic Claude Sonnet 4 - latest' },
      { name: 'Grok', slug: 'grok', provider: 'xai', category: 'TEXT', tokenCost: 5, priceItemCode: 'TEXT_GROK', description: 'xAI Grok model' },

      // Image models
      { name: 'Flux Schnell', slug: 'flux-schnell', provider: 'piapi', category: 'IMAGE', tokenCost: 2, priceItemCode: 'IMAGE_FLUX_SCHNELL', description: 'Fast affordable images ($0.0015)' },
      { name: 'SDXL Lightning', slug: 'sdxl-lightning', provider: 'replicate', category: 'IMAGE', tokenCost: 3, priceItemCode: 'IMAGE_SDXL_LIGHTNING', description: 'Ultra-fast 4-step generation' },
      { name: 'Flux Kontext', slug: 'flux-kontext', provider: 'kieai', category: 'IMAGE', tokenCost: 5, priceItemCode: 'IMAGE_FLUX_KONTEXT', description: 'Flux Kontext Pro - context-aware generation' },
      { name: 'DALL-E 2', slug: 'dall-e-2', provider: 'openai', category: 'IMAGE', tokenCost: 10, priceItemCode: 'IMAGE_DALLE2', description: 'OpenAI DALL-E 2 - fast and affordable' },
      { name: 'Flux Dev', slug: 'flux-dev', provider: 'runware', category: 'IMAGE', tokenCost: 12, priceItemCode: 'IMAGE_FLUX_DEV', description: 'Flux Dev - high-quality generation' },
      { name: 'Flux Pro', slug: 'flux-pro', provider: 'replicate', category: 'IMAGE', tokenCost: 20, priceItemCode: 'IMAGE_FLUX_PRO', description: 'Flux Pro v1.1 - best quality' },
      { name: 'Stable Diffusion XL', slug: 'sdxl', provider: 'replicate', category: 'IMAGE', tokenCost: 8, priceItemCode: 'IMAGE_SDXL', description: 'High-quality versatile generation' },
      { name: 'Playground v2.5', slug: 'playground-v2-5', provider: 'replicate', category: 'IMAGE', tokenCost: 8, priceItemCode: 'IMAGE_PLAYGROUND', description: 'Aesthetic high-quality images' },
      { name: 'Nano Banana Pro', slug: 'nano-banana-pro', provider: 'kieai', category: 'IMAGE', tokenCost: 20, priceItemCode: 'IMAGE_NANO_BANANA_PRO', description: 'Google Gemini 3 Pro Image — powerful AI image generation' },
      { name: 'DALL-E 3', slug: 'dall-e-3', provider: 'openai', category: 'IMAGE', tokenCost: 25, priceItemCode: 'IMAGE_DALLE3', description: 'OpenAI DALL-E 3 - premium quality' },
      { name: 'Midjourney', slug: 'midjourney', provider: 'kieai', category: 'IMAGE', tokenCost: 25, priceItemCode: 'IMAGE_MIDJOURNEY', description: 'Midjourney artistic image generation via KieAI' },

      // Video models
      { name: 'Wan 2.1', slug: 'wan', provider: 'replicate', category: 'VIDEO', tokenCost: 10, priceItemCode: 'VIDEO_WAN', description: 'Wan AI video generation (~$0.25)' },
      { name: 'Seedance 1.5', slug: 'seedance', provider: 'kieai', category: 'VIDEO', tokenCost: 10, priceItemCode: 'VIDEO_SEEDANCE', description: 'ByteDance Seedance 1.5 Pro text-to-video (~$0.20)' },
      { name: 'Kling', slug: 'kling', provider: 'piapi', category: 'VIDEO', tokenCost: 12, priceItemCode: 'VIDEO_KLING', description: 'Kling 5s video (~$0.26)' },
      { name: 'Runway', slug: 'runway', provider: 'kieai', category: 'VIDEO', tokenCost: 15, priceItemCode: 'VIDEO_RUNWAY', description: 'Runway Gen-4 Turbo text-to-video (~$0.30)' },
      { name: 'Luma Dream Machine', slug: 'luma', provider: 'replicate', category: 'VIDEO', tokenCost: 18, priceItemCode: 'VIDEO_LUMA', description: 'Luma AI Dream Machine (~$0.40)' },
      { name: 'Kling Pro', slug: 'kling-pro', provider: 'piapi', category: 'VIDEO', tokenCost: 20, priceItemCode: 'VIDEO_KLING_PRO', description: 'Kling 10s extended video (~$0.46)' },
      { name: 'Veo Fast', slug: 'veo-fast', provider: 'kieai', category: 'VIDEO', tokenCost: 20, priceItemCode: 'VIDEO_VEO_FAST', description: 'Google Veo 3.1 Fast (~$0.40)' },
      { name: 'Sora', slug: 'sora', provider: 'kieai', category: 'VIDEO', tokenCost: 25, priceItemCode: 'VIDEO_SORA', description: 'OpenAI Sora 2 text-to-video (~$0.50)' },
      { name: 'Veo Quality', slug: 'veo', provider: 'kieai', category: 'VIDEO', tokenCost: 80, priceItemCode: 'VIDEO_VEO', description: 'Google Veo 3.1 Quality (~$2.00)' },

      // Audio models
      { name: 'Deepgram TTS', slug: 'deepgram-tts', provider: 'openai', category: 'AUDIO', tokenCost: 2, priceItemCode: 'AUDIO_DEEPGRAM', description: 'Text-to-speech via OpenAI TTS (~$0.015/1K chars)' },
      { name: 'Fish Speech', slug: 'fish-speech', provider: 'replicate', category: 'AUDIO', tokenCost: 5, priceItemCode: 'AUDIO_FISH_SPEECH', description: 'Fast voice cloning (~$0.03)' },
      { name: 'XTTS v2', slug: 'xtts-v2', provider: 'replicate', category: 'AUDIO', tokenCost: 8, priceItemCode: 'AUDIO_XTTS', description: 'Multilingual voice cloning (~$0.05)' },
      { name: 'Bark', slug: 'bark', provider: 'replicate', category: 'AUDIO', tokenCost: 10, priceItemCode: 'AUDIO_BARK', description: 'Text-to-speech with emotion (~$0.07)' },
      { name: 'OpenAI TTS', slug: 'openai-tts', provider: 'openai', category: 'AUDIO', tokenCost: 10, priceItemCode: 'AUDIO_OPENAI_TTS', description: 'OpenAI text-to-speech ($0.015/1K chars)' },
      { name: 'ElevenLabs TTS', slug: 'elevenlabs-tts', provider: 'elevenlabs', category: 'AUDIO', tokenCost: 15, priceItemCode: 'AUDIO_ELEVENLABS', description: 'Premium text-to-speech (~$0.06)' },
      { name: 'Suno', slug: 'suno', provider: 'replicate', category: 'AUDIO', tokenCost: 80, priceItemCode: 'AUDIO_SUNO', description: 'AI music generation (~$0.10)' },
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
