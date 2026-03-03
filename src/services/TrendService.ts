import { TrendGenerationStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { walletService } from './WalletService';
import { logger } from '../utils/logger';

export class TrendService {
  // ── Public queries ──────────────────────────────────────

  async getActiveTrends(opts: {
    categorySlug?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const { categorySlug, limit = 20, offset = 0 } = opts;

    const where: Prisma.VideoTrendWhereInput = { isActive: true };
    if (categorySlug && categorySlug !== 'all') {
      where.category = { slug: categorySlug };
    }

    const [trends, total] = await Promise.all([
      prisma.videoTrend.findMany({
        where,
        include: { category: true },
        orderBy: [
          { isFeatured: 'desc' },
          { sortOrder: 'asc' },
          { usageCount: 'desc' },
        ],
        skip: offset,
        take: limit,
      }),
      prisma.videoTrend.count({ where }),
    ]);

    return { trends, total };
  }

  async getCategories() {
    return prisma.trendCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getTrendById(id: string) {
    return prisma.videoTrend.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  // ── Admin CRUD ──────────────────────────────────────────

  async getAllTrendsAdmin() {
    return prisma.videoTrend.findMany({
      include: { category: true, _count: { select: { generations: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTrend(data: {
    name: string;
    nameEn?: string;
    description?: string;
    descriptionEn?: string;
    videoUrl: string;
    thumbnailUrl?: string;
    referenceVideoUrl?: string;
    model?: string;
    promptTemplate: string;
    negativePrompt?: string;
    duration?: number;
    aspectRatio?: string;
    tokenCost?: number;
    categoryId?: string;
    tags?: string[];
    isFeatured?: boolean;
    isNew?: boolean;
    isActive?: boolean;
    sortOrder?: number;
    createdBy?: string;
  }) {
    const trend = await prisma.videoTrend.create({
      data: {
        name: data.name,
        nameEn: data.nameEn,
        description: data.description,
        descriptionEn: data.descriptionEn,
        videoUrl: data.videoUrl,
        thumbnailUrl: data.thumbnailUrl,
        referenceVideoUrl: data.referenceVideoUrl,
        model: data.model || 'kling-motion',
        promptTemplate: data.promptTemplate,
        negativePrompt: data.negativePrompt,
        duration: data.duration ?? 5,
        aspectRatio: data.aspectRatio || '9:16',
        tokenCost: data.tokenCost ?? 5,
        categoryId: data.categoryId || null,
        tags: data.tags || [],
        isFeatured: data.isFeatured ?? false,
        isNew: data.isNew ?? false,
        isActive: data.isActive !== false,
        sortOrder: data.sortOrder ?? 0,
        createdBy: data.createdBy,
      },
      include: { category: true },
    });

    logger.info('Created video trend', { trendId: trend.id, name: trend.name });
    return trend;
  }

  async updateTrend(id: string, data: Partial<{
    name: string;
    nameEn: string;
    description: string;
    descriptionEn: string;
    videoUrl: string;
    thumbnailUrl: string;
    referenceVideoUrl: string;
    model: string;
    promptTemplate: string;
    negativePrompt: string;
    duration: number;
    aspectRatio: string;
    tokenCost: number;
    categoryId: string | null;
    tags: string[];
    isFeatured: boolean;
    isNew: boolean;
    isActive: boolean;
    sortOrder: number;
  }>) {
    // Convert empty string categoryId to null to avoid FK violation
    if ('categoryId' in data && !data.categoryId) {
      data.categoryId = null;
    }

    const trend = await prisma.videoTrend.update({
      where: { id },
      data,
      include: { category: true },
    });

    logger.info('Updated video trend', { trendId: id });
    return trend;
  }

  async deleteTrend(id: string) {
    // Delete associated generations first, then the trend
    await prisma.trendGeneration.deleteMany({ where: { trendId: id } });
    await prisma.videoTrend.delete({ where: { id } });
    logger.info('Deleted video trend', { trendId: id });
  }

  // ── Category CRUD ───────────────────────────────────────

  async getAllCategoriesAdmin() {
    return prisma.trendCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { trends: true } } },
    });
  }

  async createCategory(data: {
    slug: string;
    name: string;
    nameEn?: string;
    icon?: string;
    sortOrder?: number;
  }) {
    return prisma.trendCategory.create({ data });
  }

  async updateCategory(id: string, data: Partial<{
    slug: string;
    name: string;
    nameEn: string;
    icon: string;
    sortOrder: number;
    isActive: boolean;
  }>) {
    return prisma.trendCategory.update({ where: { id }, data });
  }

  // ── Generation lifecycle ────────────────────────────────

  async createGeneration(userId: string, trendId: string, sourcePhotoUrl: string) {
    const trend = await prisma.videoTrend.findUnique({ where: { id: trendId } });
    if (!trend || !trend.isActive) {
      throw new Error('Trend not found or inactive');
    }

    const hasFunds = await walletService.hasSufficientBalance(userId, trend.tokenCost);
    if (!hasFunds) {
      const balance = await walletService.getBalance(userId);
      throw Object.assign(new Error('Insufficient tokens'), {
        code: 'INSUFFICIENT_TOKENS',
        required: trend.tokenCost,
        balance,
      });
    }

    const generation = await prisma.trendGeneration.create({
      data: {
        userId,
        trendId,
        sourcePhotoUrl,
        tokensSpent: trend.tokenCost,
        status: 'PENDING',
      },
    });

    // Deduct tokens
    await walletService.deductCredits(userId, 'VIDEO', trend.tokenCost, {
      requestId: generation.id,
      priceItemCode: `trend_${trendId}`,
      description: `Trend video: ${trend.name}`,
    });

    // Increment usage count
    await prisma.videoTrend.update({
      where: { id: trendId },
      data: { usageCount: { increment: 1 } },
    });

    logger.info('Created trend generation', {
      generationId: generation.id,
      userId,
      trendId,
      tokenCost: trend.tokenCost,
    });

    return { generation, trend };
  }

  async updateGenerationStatus(
    id: string,
    status: TrendGenerationStatus,
    data?: {
      resultVideoUrl?: string;
      resultFileId?: string;
      processingTime?: number;
      errorMessage?: string;
      requestId?: string;
    }
  ) {
    const updateData: Prisma.TrendGenerationUpdateInput = { status };

    if (data?.resultVideoUrl) updateData.resultVideoUrl = data.resultVideoUrl;
    if (data?.resultFileId) updateData.resultFileId = data.resultFileId;
    if (data?.processingTime) updateData.processingTime = data.processingTime;
    if (data?.errorMessage) updateData.errorMessage = data.errorMessage;
    if (data?.requestId) updateData.requestId = data.requestId;

    if (status === 'COMPLETED' || status === 'FAILED') {
      updateData.completedAt = new Date();
    }

    const generation = await prisma.trendGeneration.update({
      where: { id },
      data: updateData,
    });

    logger.info(`Trend generation ${status}`, { generationId: id });
    return generation;
  }

  async refundGeneration(generationId: string) {
    const generation = await prisma.trendGeneration.findUnique({
      where: { id: generationId },
    });
    if (!generation || generation.tokensSpent <= 0) return;

    await walletService.refundCredits(generation.userId, 'VIDEO', generation.tokensSpent, {
      requestId: generation.id,
      priceItemCode: `trend_${generation.trendId}`,
      description: `Refund for failed trend video`,
    });

    logger.info('Refunded trend generation tokens', {
      generationId,
      amount: generation.tokensSpent,
      userId: generation.userId,
    });
  }

  async getGenerationStatus(id: string, userId: string) {
    return prisma.trendGeneration.findFirst({
      where: { id, userId },
    });
  }

  // ── Seed default categories ─────────────────────────────

  async seedDefaultCategories() {
    const defaults = [
      { slug: 'dance', name: 'Танцы', nameEn: 'Dance', icon: '💃', sortOrder: 1 },
      { slug: 'funny', name: 'Смешные', nameEn: 'Funny', icon: '😂', sortOrder: 2 },
      { slug: 'romantic', name: 'Романтика', nameEn: 'Romantic', icon: '❤️', sortOrder: 3 },
      { slug: 'emotional', name: 'Эмоции', nameEn: 'Emotional', icon: '🎭', sortOrder: 4 },
      { slug: 'viral', name: 'Вирусные', nameEn: 'Viral', icon: '🔥', sortOrder: 5 },
      { slug: 'other', name: 'Другое', nameEn: 'Other', icon: '✨', sortOrder: 99 },
    ];

    for (const cat of defaults) {
      await prisma.trendCategory.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      });
    }

    logger.info('Seeded default trend categories');
  }
}

export const trendService = new TrendService();
