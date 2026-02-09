import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export interface ImageModelSettings {
  aspectRatio?: string;
  quality?: string;   // 'standard' | 'hd' (DALL-E 3 only)
  style?: string;     // 'vivid' | 'natural' (DALL-E 3 only)
}

const MODEL_DEFAULTS: Record<string, ImageModelSettings> = {
  'flux-schnell': { aspectRatio: '1:1' },
  'flux-kontext': { aspectRatio: '1:1' },
  'flux-dev': { aspectRatio: '1:1' },
  'flux-pro': { aspectRatio: '1:1' },
  'sdxl-lightning': { aspectRatio: '1:1' },
  'sdxl': { aspectRatio: '1:1' },
  'playground-v2-5': { aspectRatio: '1:1' },
  'dall-e-2': { aspectRatio: '1:1' },
  'dall-e-3': { aspectRatio: '1:1', quality: 'standard', style: 'vivid' },
  'ideogram': { aspectRatio: '1:1' },
};

export class ImageSettingsService {
  async getOrCreate(userId: string) {
    return prisma.userImageSettings.upsert({
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

  getDefaults(modelSlug: string): ImageModelSettings {
    return MODEL_DEFAULTS[modelSlug] || { aspectRatio: '1:1' };
  }

  getAllDefaults(): Record<string, ImageModelSettings> {
    return { ...MODEL_DEFAULTS };
  }

  async getModelSettings(userId: string, modelSlug: string): Promise<ImageModelSettings> {
    const record = await this.getOrCreate(userId);
    const allSettings = (record.settings as Record<string, ImageModelSettings>) || {};
    const saved = allSettings[modelSlug] || {};
    return { ...this.getDefaults(modelSlug), ...saved };
  }

  async getModelSettingsByTelegramId(telegramId: bigint, modelSlug: string): Promise<ImageModelSettings> {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { id: true },
    });

    if (!user) {
      return this.getDefaults(modelSlug);
    }

    return this.getModelSettings(user.id, modelSlug);
  }

  async updateModelSettings(userId: string, modelSlug: string, settings: Partial<ImageModelSettings>) {
    const record = await this.getOrCreate(userId);
    const allSettings = (record.settings as Record<string, ImageModelSettings>) || {};
    const current = allSettings[modelSlug] || {};
    const merged = { ...this.getDefaults(modelSlug), ...current, ...settings };
    allSettings[modelSlug] = merged;

    await prisma.userImageSettings.update({
      where: { userId },
      data: { settings: allSettings as any },
    });

    logger.info(`Updated image settings for user ${userId}, model ${modelSlug}`);
    return merged;
  }

  async getAllSettings(userId: string): Promise<Record<string, ImageModelSettings>> {
    const record = await this.getOrCreate(userId);
    return (record.settings as Record<string, ImageModelSettings>) || {};
  }

  async getAllSettingsByTelegramId(telegramId: bigint): Promise<Record<string, ImageModelSettings>> {
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

export const imageSettingsService = new ImageSettingsService();
