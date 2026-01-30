import { AIModel, ModelCategory } from '@prisma/client';
import { prisma } from '../config/database';

// Maps model slug to price item code
const SLUG_TO_PRICE: Record<string, string> = {
  'gpt-4o': 'TEXT_GPT4O',
  'gpt-4o-mini': 'TEXT_GPT4O_MINI',
  'claude-sonnet': 'TEXT_CLAUDE_SONNET',
  'grok': 'TEXT_GROK',
  'dall-e-3': 'IMAGE_DALLE3',
  'flux-pro': 'IMAGE_FLUX_PRO',
  'flux-schnell': 'IMAGE_FLUX_SCHNELL',
  'sdxl-lightning': 'IMAGE_SDXL_LIGHTNING',
  'sdxl': 'IMAGE_SDXL',
  'playground-v2-5': 'IMAGE_PLAYGROUND',
  'kling': 'VIDEO_KLING',
  'luma': 'VIDEO_LUMA',
  'animatediff': 'VIDEO_ANIMATEDIFF',
  'zeroscope-v2': 'VIDEO_ZEROSCOPE',
  'elevenlabs-tts': 'AUDIO_ELEVENLABS',
  'suno': 'AUDIO_SUNO',
  'xtts-v2': 'AUDIO_XTTS',
  'bark': 'AUDIO_BARK',
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
      { name: 'DALL-E 3', slug: 'dall-e-3', provider: 'openai', category: 'IMAGE', tokenCost: 25, priceItemCode: 'IMAGE_DALLE3', description: 'OpenAI DALL-E 3 image generation' },
      { name: 'Flux Pro', slug: 'flux-pro', provider: 'replicate', category: 'IMAGE', tokenCost: 25, priceItemCode: 'IMAGE_FLUX_PRO', description: 'Black Forest Labs Flux Pro' },
      { name: 'Flux Schnell', slug: 'flux-schnell', provider: 'replicate', category: 'IMAGE', tokenCost: 15, priceItemCode: 'IMAGE_FLUX_SCHNELL', description: 'Black Forest Labs Flux Schnell - fast' },
      { name: 'SDXL Lightning', slug: 'sdxl-lightning', provider: 'replicate', category: 'IMAGE', tokenCost: 10, priceItemCode: 'IMAGE_SDXL_LIGHTNING', description: 'Ultra-fast 4-step generation (sub-second)' },
      { name: 'Stable Diffusion XL', slug: 'sdxl', provider: 'replicate', category: 'IMAGE', tokenCost: 18, priceItemCode: 'IMAGE_SDXL', description: 'High-quality versatile generation' },
      { name: 'Playground v2.5', slug: 'playground-v2-5', provider: 'replicate', category: 'IMAGE', tokenCost: 12, priceItemCode: 'IMAGE_PLAYGROUND', description: 'Aesthetic high-quality images' },

      // Video models
      { name: 'Kling', slug: 'kling', provider: 'replicate', category: 'VIDEO', tokenCost: 150, priceItemCode: 'VIDEO_KLING', description: 'Kling video generation' },
      { name: 'Luma Dream Machine', slug: 'luma', provider: 'replicate', category: 'VIDEO', tokenCost: 150, priceItemCode: 'VIDEO_LUMA', description: 'Luma AI Dream Machine' },
      { name: 'AnimateDiff', slug: 'animatediff', provider: 'replicate', category: 'VIDEO', tokenCost: 80, priceItemCode: 'VIDEO_ANIMATEDIFF', description: 'Fast motion video generation' },
      { name: 'Zeroscope v2 XL', slug: 'zeroscope-v2', provider: 'replicate', category: 'VIDEO', tokenCost: 100, priceItemCode: 'VIDEO_ZEROSCOPE', description: 'Fast text-to-video' },

      // Audio models
      { name: 'ElevenLabs TTS', slug: 'elevenlabs-tts', provider: 'elevenlabs', category: 'AUDIO', tokenCost: 15, priceItemCode: 'AUDIO_ELEVENLABS', description: 'ElevenLabs text-to-speech' },
      { name: 'Suno', slug: 'suno', provider: 'replicate', category: 'AUDIO', tokenCost: 80, priceItemCode: 'AUDIO_SUNO', description: 'Suno music generation' },
      { name: 'XTTS v2', slug: 'xtts-v2', provider: 'replicate', category: 'AUDIO', tokenCost: 8, priceItemCode: 'AUDIO_XTTS', description: 'Fast multilingual voice cloning' },
      { name: 'Bark', slug: 'bark', provider: 'replicate', category: 'AUDIO', tokenCost: 10, priceItemCode: 'AUDIO_BARK', description: 'Text-to-speech with emotion' },
      { name: 'Fish Speech', slug: 'fish-speech', provider: 'replicate', category: 'AUDIO', tokenCost: 8, priceItemCode: 'AUDIO_FISH_SPEECH', description: 'Ultra-fast voice cloning' },
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
