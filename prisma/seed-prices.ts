import { PrismaClient, Prisma, WalletCategory } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPrices() {
  const prices: {
    itemCode: string;
    category: WalletCategory;
    name: string;
    description: string;
    creditsPerUnit: number;
    unitType: string;
    minCredits?: number;
    maxCredits?: number;
    metadata?: Prisma.InputJsonValue;
  }[] = [
    // TEXT MODELS
    {
      itemCode: 'TEXT_GPT4O',
      category: 'TEXT',
      name: 'GPT-4o',
      description: 'Most advanced OpenAI model',
      creditsPerUnit: 5,
      unitType: '1_request',
      metadata: { provider: 'openai', model: 'gpt-4o' },
    },
    {
      itemCode: 'TEXT_GPT4O_MINI',
      category: 'TEXT',
      name: 'GPT-4o Mini',
      description: 'Fast and efficient OpenAI model',
      creditsPerUnit: 3,
      unitType: '1_request',
      metadata: { provider: 'openai', model: 'gpt-4o-mini' },
    },
    {
      itemCode: 'TEXT_CLAUDE_SONNET',
      category: 'TEXT',
      name: 'Claude Sonnet 4',
      description: 'Anthropic Claude Sonnet 4',
      creditsPerUnit: 5,
      unitType: '1_request',
      metadata: { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
    },
    {
      itemCode: 'TEXT_GROK',
      category: 'TEXT',
      name: 'Grok',
      description: 'xAI Grok model',
      creditsPerUnit: 5,
      unitType: '1_request',
      metadata: { provider: 'xai', model: 'grok-2' },
    },

    // IMAGE MODELS
    {
      itemCode: 'IMAGE_DALLE3',
      category: 'IMAGE',
      name: 'DALL-E 3',
      description: 'OpenAI image generation',
      creditsPerUnit: 25,
      unitType: '1_image',
      metadata: { provider: 'openai', model: 'dall-e-3' },
    },
    {
      itemCode: 'IMAGE_FLUX_PRO',
      category: 'IMAGE',
      name: 'Flux Pro',
      description: 'Best quality image generation',
      creditsPerUnit: 25,
      unitType: '1_image',
      metadata: { provider: 'replicate', model: 'flux-pro' },
    },
    {
      itemCode: 'IMAGE_FLUX_SCHNELL',
      category: 'IMAGE',
      name: 'Flux Schnell',
      description: 'Fast affordable images',
      creditsPerUnit: 15,
      unitType: '1_image',
      metadata: { provider: 'replicate', model: 'flux-schnell' },
    },
    {
      itemCode: 'IMAGE_SDXL_LIGHTNING',
      category: 'IMAGE',
      name: 'SDXL Lightning',
      description: 'Ultra-fast 4-step generation (sub-second)',
      creditsPerUnit: 10,
      unitType: '1_image',
      metadata: { provider: 'replicate', model: 'bytedance/sdxl-lightning-4step' },
    },
    {
      itemCode: 'IMAGE_SDXL',
      category: 'IMAGE',
      name: 'Stable Diffusion XL',
      description: 'High-quality versatile generation',
      creditsPerUnit: 18,
      unitType: '1_image',
      metadata: { provider: 'replicate', model: 'stability-ai/sdxl' },
    },
    {
      itemCode: 'IMAGE_PLAYGROUND',
      category: 'IMAGE',
      name: 'Playground v2.5',
      description: 'Aesthetic high-quality images',
      creditsPerUnit: 12,
      unitType: '1_image',
      metadata: { provider: 'replicate', model: 'playgroundai/playground-v2.5-1024px-aesthetic' },
    },

    // VIDEO MODELS
    {
      itemCode: 'VIDEO_KLING',
      category: 'VIDEO',
      name: 'Kling AI',
      description: 'Kling video generation',
      creditsPerUnit: 150,
      unitType: '1_video',
      minCredits: 100,
      maxCredits: 200,
      metadata: { provider: 'replicate', model: 'kling' },
    },
    {
      itemCode: 'VIDEO_LUMA',
      category: 'VIDEO',
      name: 'Luma Dream Machine',
      description: 'Luma video generation',
      creditsPerUnit: 150,
      unitType: '1_video',
      minCredits: 100,
      maxCredits: 200,
      metadata: { provider: 'replicate', model: 'luma' },
    },
    {
      itemCode: 'VIDEO_ANIMATEDIFF',
      category: 'VIDEO',
      name: 'AnimateDiff',
      description: 'Fast motion video generation',
      creditsPerUnit: 80,
      unitType: '1_video',
      minCredits: 80,
      maxCredits: 120,
      metadata: { provider: 'replicate', model: 'lucataco/animate-diff' },
    },
    {
      itemCode: 'VIDEO_ZEROSCOPE',
      category: 'VIDEO',
      name: 'Zeroscope v2 XL',
      description: 'Fast text-to-video',
      creditsPerUnit: 100,
      unitType: '1_video',
      minCredits: 100,
      maxCredits: 150,
      metadata: { provider: 'replicate', model: 'anotherjesse/zeroscope-v2-xl' },
    },

    // AUDIO MODELS
    {
      itemCode: 'AUDIO_ELEVENLABS',
      category: 'AUDIO',
      name: 'ElevenLabs TTS',
      description: 'High quality text-to-speech',
      creditsPerUnit: 15,
      unitType: '1_request',
      metadata: { provider: 'elevenlabs' },
    },
    {
      itemCode: 'AUDIO_SUNO',
      category: 'AUDIO',
      name: 'Suno AI Music',
      description: 'AI-generated music',
      creditsPerUnit: 80,
      unitType: '1_song',
      metadata: { provider: 'replicate', model: 'suno' },
    },
    {
      itemCode: 'AUDIO_XTTS',
      category: 'AUDIO',
      name: 'XTTS v2',
      description: 'Fast multilingual voice cloning (6s sample)',
      creditsPerUnit: 8,
      unitType: '1_request',
      metadata: { provider: 'replicate', model: 'coqui/xtts-v2' },
    },
    {
      itemCode: 'AUDIO_BARK',
      category: 'AUDIO',
      name: 'Bark',
      description: 'Text-to-speech with emotion',
      creditsPerUnit: 10,
      unitType: '1_request',
      metadata: { provider: 'replicate', model: 'suno-ai/bark' },
    },
    {
      itemCode: 'AUDIO_FISH_SPEECH',
      category: 'AUDIO',
      name: 'Fish Speech',
      description: 'Ultra-fast voice cloning (10s sample)',
      creditsPerUnit: 8,
      unitType: '1_request',
      metadata: { provider: 'replicate', model: 'fishaudio/fish-speech-1' },
    },
  ];

  for (const price of prices) {
    await prisma.priceItem.upsert({
      where: { itemCode: price.itemCode },
      create: price,
      update: price,
    });
  }

  console.log(`Seeded ${prices.length} price items`);
}

seedPrices()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
