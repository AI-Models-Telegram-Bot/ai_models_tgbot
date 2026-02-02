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

    // IMAGE MODELS (sorted by cost)
    {
      itemCode: 'IMAGE_FLUX_SCHNELL',
      category: 'IMAGE',
      name: 'Flux Schnell',
      description: 'Fast affordable images ($0.0015)',
      creditsPerUnit: 2,
      unitType: '1_image',
      metadata: { provider: 'piapi', model: 'flux-schnell' },
    },
    {
      itemCode: 'IMAGE_SDXL_LIGHTNING',
      category: 'IMAGE',
      name: 'SDXL Lightning',
      description: 'Ultra-fast 4-step generation',
      creditsPerUnit: 3,
      unitType: '1_image',
      metadata: { provider: 'replicate', model: 'sdxl-lightning' },
    },
    {
      itemCode: 'IMAGE_FLUX_KONTEXT',
      category: 'IMAGE',
      name: 'Flux Kontext Pro',
      description: 'Context-aware image generation (~$0.01)',
      creditsPerUnit: 5,
      unitType: '1_image',
      metadata: { provider: 'kieai', model: 'flux-kontext' },
    },
    {
      itemCode: 'IMAGE_SDXL',
      category: 'IMAGE',
      name: 'Stable Diffusion XL',
      description: 'High-quality versatile generation',
      creditsPerUnit: 8,
      unitType: '1_image',
      metadata: { provider: 'replicate', model: 'sdxl' },
    },
    {
      itemCode: 'IMAGE_PLAYGROUND',
      category: 'IMAGE',
      name: 'Playground v2.5',
      description: 'Aesthetic high-quality images',
      creditsPerUnit: 8,
      unitType: '1_image',
      metadata: { provider: 'replicate', model: 'playground-v2-5' },
    },
    {
      itemCode: 'IMAGE_DALLE2',
      category: 'IMAGE',
      name: 'DALL-E 2',
      description: 'OpenAI DALL-E 2 - fast and affordable ($0.02)',
      creditsPerUnit: 10,
      unitType: '1_image',
      metadata: { provider: 'openai', model: 'dall-e-2' },
    },
    {
      itemCode: 'IMAGE_FLUX_DEV',
      category: 'IMAGE',
      name: 'Flux Dev',
      description: 'High-quality Flux generation (~$0.025)',
      creditsPerUnit: 12,
      unitType: '1_image',
      metadata: { provider: 'aimlapi', model: 'flux-dev' },
    },
    {
      itemCode: 'IMAGE_FLUX_PRO',
      category: 'IMAGE',
      name: 'Flux Pro v1.1',
      description: 'Best quality Flux generation (~$0.04)',
      creditsPerUnit: 20,
      unitType: '1_image',
      metadata: { provider: 'aimlapi', model: 'flux-pro' },
    },
    {
      itemCode: 'IMAGE_DALLE3',
      category: 'IMAGE',
      name: 'DALL-E 3',
      description: 'OpenAI premium image generation ($0.04)',
      creditsPerUnit: 25,
      unitType: '1_image',
      metadata: { provider: 'openai', model: 'dall-e-3' },
    },
    {
      itemCode: 'IMAGE_IDEOGRAM',
      category: 'IMAGE',
      name: 'Ideogram v2',
      description: 'Best for text in images (~$0.08)',
      creditsPerUnit: 30,
      unitType: '1_image',
      metadata: { provider: 'aimlapi', model: 'ideogram' },
    },

    // VIDEO MODELS (sorted by cost)
    {
      itemCode: 'VIDEO_ANIMATEDIFF',
      category: 'VIDEO',
      name: 'AnimateDiff',
      description: 'Fast motion video generation (~$0.06)',
      creditsPerUnit: 50,
      unitType: '1_video',
      minCredits: 50,
      maxCredits: 80,
      metadata: { provider: 'replicate', model: 'animatediff' },
    },
    {
      itemCode: 'VIDEO_ZEROSCOPE',
      category: 'VIDEO',
      name: 'Zeroscope v2 XL',
      description: 'Fast text-to-video (~$0.06)',
      creditsPerUnit: 50,
      unitType: '1_video',
      minCredits: 50,
      maxCredits: 80,
      metadata: { provider: 'replicate', model: 'zeroscope-v2' },
    },
    {
      itemCode: 'VIDEO_WAN',
      category: 'VIDEO',
      name: 'Wan 2.1',
      description: 'Wan AI video generation (~$0.10)',
      creditsPerUnit: 80,
      unitType: '1_video',
      minCredits: 80,
      maxCredits: 120,
      metadata: { provider: 'aimlapi', model: 'wan' },
    },
    {
      itemCode: 'VIDEO_KLING',
      category: 'VIDEO',
      name: 'Kling (5s)',
      description: 'Kling 5-second video ($0.13)',
      creditsPerUnit: 100,
      unitType: '1_video',
      minCredits: 100,
      maxCredits: 150,
      metadata: { provider: 'piapi', model: 'kling' },
    },
    {
      itemCode: 'VIDEO_KLING_PRO',
      category: 'VIDEO',
      name: 'Kling Pro (10s)',
      description: 'Kling 10-second extended video ($0.26)',
      creditsPerUnit: 200,
      unitType: '1_video',
      minCredits: 200,
      maxCredits: 300,
      metadata: { provider: 'piapi', model: 'kling-pro' },
    },
    {
      itemCode: 'VIDEO_LUMA',
      category: 'VIDEO',
      name: 'Luma Dream Machine',
      description: 'Luma AI Dream Machine (~$0.40)',
      creditsPerUnit: 150,
      unitType: '1_video',
      minCredits: 100,
      maxCredits: 200,
      metadata: { provider: 'replicate', model: 'luma' },
    },

    // AUDIO MODELS (sorted by cost)
    {
      itemCode: 'AUDIO_DEEPGRAM',
      category: 'AUDIO',
      name: 'Deepgram TTS',
      description: 'Ultra-cheap text-to-speech (~$0.001)',
      creditsPerUnit: 2,
      unitType: '1_request',
      metadata: { provider: 'aimlapi', model: 'deepgram-tts' },
    },
    {
      itemCode: 'AUDIO_FISH_SPEECH',
      category: 'AUDIO',
      name: 'Fish Speech',
      description: 'Fast voice cloning (~$0.03)',
      creditsPerUnit: 5,
      unitType: '1_request',
      metadata: { provider: 'replicate', model: 'fish-speech' },
    },
    {
      itemCode: 'AUDIO_XTTS',
      category: 'AUDIO',
      name: 'XTTS v2',
      description: 'Multilingual voice cloning (~$0.05)',
      creditsPerUnit: 8,
      unitType: '1_request',
      metadata: { provider: 'replicate', model: 'xtts-v2' },
    },
    {
      itemCode: 'AUDIO_BARK',
      category: 'AUDIO',
      name: 'Bark',
      description: 'Text-to-speech with emotion (~$0.07)',
      creditsPerUnit: 10,
      unitType: '1_request',
      metadata: { provider: 'replicate', model: 'bark' },
    },
    {
      itemCode: 'AUDIO_OPENAI_TTS',
      category: 'AUDIO',
      name: 'OpenAI TTS',
      description: 'OpenAI text-to-speech ($0.015/1K chars)',
      creditsPerUnit: 10,
      unitType: '1_request',
      metadata: { provider: 'aimlapi', model: 'openai-tts' },
    },
    {
      itemCode: 'AUDIO_ELEVENLABS',
      category: 'AUDIO',
      name: 'ElevenLabs TTS',
      description: 'Premium text-to-speech (~$0.06)',
      creditsPerUnit: 15,
      unitType: '1_request',
      metadata: { provider: 'elevenlabs' },
    },
    {
      itemCode: 'AUDIO_SUNO',
      category: 'AUDIO',
      name: 'Suno AI Music',
      description: 'AI music generation (~$0.10)',
      creditsPerUnit: 80,
      unitType: '1_song',
      metadata: { provider: 'replicate', model: 'suno' },
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
