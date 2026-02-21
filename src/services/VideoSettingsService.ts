import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export interface VideoModelSettings {
  aspectRatio?: string;
  duration?: number;
  resolution?: string;
  generateAudio?: boolean;
  mode?: string;           // 'text' | 'frames' | 'ingredients' (Veo only)
  // Kling-specific fields
  version?: string;        // e.g. '2.6', '2.5', '2.1', '2.1-master', '1.6', '1.5'
  negativePrompt?: string;
  cfgScale?: number;       // creativity: 0-1, default 0.5
  enableAudio?: boolean;   // Kling native audio (2.6 pro only)
}

const MODEL_DEFAULTS: Record<string, VideoModelSettings> = {
  'kling': { aspectRatio: '16:9', version: '2.6', duration: 5, cfgScale: 0.5 },
  'kling-pro': { aspectRatio: '16:9', version: '2.6', duration: 5, cfgScale: 0.5 },
  'veo-fast': { aspectRatio: '16:9', duration: 8, resolution: '1080p', generateAudio: true, mode: 'text' },
  'veo': { aspectRatio: '16:9', duration: 8, resolution: '1080p', generateAudio: true, mode: 'text' },
  'sora': { aspectRatio: '16:9', duration: 4, resolution: '720p' },
  'sora-pro': { aspectRatio: '16:9', duration: 4, resolution: '720p' },
  'runway': { aspectRatio: '16:9', duration: 5, resolution: '720p' },
  'runway-gen4': { aspectRatio: '16:9', duration: 5, resolution: '720p' },
  'luma': {},
  'wan': {},
  'seedance': { aspectRatio: '16:9', duration: 4, resolution: '720p' },
  'seedance-lite': { aspectRatio: '16:9', duration: 4, resolution: '720p' },
  'seedance-1-pro': { aspectRatio: '16:9', duration: 4, resolution: '1080p' },
  'seedance-fast': { aspectRatio: '16:9', duration: 4, resolution: '1080p' },
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
