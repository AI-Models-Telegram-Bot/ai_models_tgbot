import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export interface VideoModelSettings {
  aspectRatio?: string;
  duration?: number;
  resolution?: string;
  generateAudio?: boolean;
}

const MODEL_DEFAULTS: Record<string, VideoModelSettings> = {
  'kling': { aspectRatio: '16:9' },
  'kling-pro': { aspectRatio: '16:9' },
  'kling-master': { aspectRatio: '16:9' },
  'veo-fast': { aspectRatio: '16:9', duration: 8, resolution: '1080p', generateAudio: true },
  'veo': { aspectRatio: '16:9', duration: 8, resolution: '1080p', generateAudio: true },
  'sora': { aspectRatio: '16:9', duration: 4, resolution: '720p' },
  'runway': { aspectRatio: '16:9', duration: 5, resolution: '720p' },
  'luma': {},
  'wan': {},
  'seedance': { aspectRatio: '16:9', duration: 8, resolution: '720p' },
};

export class VideoSettingsService {
  async getOrCreate(userId: string) {
    return prisma.userVideoSettings.upsert({
      where: { userId },
      create: { userId, settings: {} },
      update: {},
    });
  }

  async getByTelegramId(telegramId: bigint) {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { id: true },
    });

    if (!user) {
      throw new Error(`User not found for telegramId: ${telegramId}`);
    }

    return this.getOrCreate(user.id);
  }

  getDefaults(modelSlug: string): VideoModelSettings {
    return MODEL_DEFAULTS[modelSlug] || {};
  }

  getAllDefaults(): Record<string, VideoModelSettings> {
    return { ...MODEL_DEFAULTS };
  }

  async getModelSettings(userId: string, modelSlug: string): Promise<VideoModelSettings> {
    const record = await this.getOrCreate(userId);
    const allSettings = (record.settings as Record<string, VideoModelSettings>) || {};
    const saved = allSettings[modelSlug] || {};
    return { ...this.getDefaults(modelSlug), ...saved };
  }

  async getModelSettingsByTelegramId(telegramId: bigint, modelSlug: string): Promise<VideoModelSettings> {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { id: true },
    });

    if (!user) {
      return this.getDefaults(modelSlug);
    }

    return this.getModelSettings(user.id, modelSlug);
  }

  async updateModelSettings(userId: string, modelSlug: string, settings: Partial<VideoModelSettings>) {
    const record = await this.getOrCreate(userId);
    const allSettings = (record.settings as Record<string, VideoModelSettings>) || {};
    const current = allSettings[modelSlug] || {};
    const merged = { ...this.getDefaults(modelSlug), ...current, ...settings };
    allSettings[modelSlug] = merged;

    await prisma.userVideoSettings.update({
      where: { userId },
      data: { settings: allSettings as any },
    });

    logger.info(`Updated video settings for user ${userId}, model ${modelSlug}`);
    return merged;
  }

  async getAllSettings(userId: string): Promise<Record<string, VideoModelSettings>> {
    const record = await this.getOrCreate(userId);
    return (record.settings as Record<string, VideoModelSettings>) || {};
  }

  async getAllSettingsByTelegramId(telegramId: bigint): Promise<Record<string, VideoModelSettings>> {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { id: true },
    });

    if (!user) {
      return {};
    }

    return this.getAllSettings(user.id);
  }
}

export const videoSettingsService = new VideoSettingsService();
