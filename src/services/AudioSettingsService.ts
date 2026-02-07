import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export interface ElevenLabsSettings {
  voiceId: string;
  voiceName: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
}

export interface SunoSettings {
  mode: 'custom' | 'standard' | 'instrumental';
  style: string;
}

export interface SoundGenSettings {
  textTemp: number;
  waveformTemp: number;
}

export interface VoiceCloningSettings {
  model: 'xtts-v2' | 'fish-speech';
}

const DEFAULT_ELEVENLABS: ElevenLabsSettings = {
  voiceId: 'EXAVITQu4vr4xnSDxMaL',
  voiceName: 'Sarah',
  modelId: 'eleven_multilingual_v2',
  stability: 0.5,
  similarityBoost: 0.75,
};

const DEFAULT_SUNO: SunoSettings = {
  mode: 'standard',
  style: '',
};

const DEFAULT_SOUND_GEN: SoundGenSettings = {
  textTemp: 0.7,
  waveformTemp: 0.7,
};

const DEFAULT_VOICE_CLONING: VoiceCloningSettings = {
  model: 'xtts-v2',
};

export class AudioSettingsService {
  async getOrCreate(userId: string) {
    return prisma.userAudioSettings.upsert({
      where: { userId },
      create: {
        userId,
        elevenLabsSettings: DEFAULT_ELEVENLABS as any,
        sunoSettings: DEFAULT_SUNO as any,
        soundGenSettings: DEFAULT_SOUND_GEN as any,
        voiceCloningSettings: DEFAULT_VOICE_CLONING as any,
      },
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

  async updateElevenLabs(userId: string, settings: Partial<ElevenLabsSettings>) {
    const current = await this.getOrCreate(userId);
    const merged = { ...DEFAULT_ELEVENLABS, ...(current.elevenLabsSettings as any || {}), ...settings };

    await prisma.userAudioSettings.update({
      where: { userId },
      data: { elevenLabsSettings: merged as any },
    });

    logger.info(`Updated ElevenLabs settings for user ${userId}`);
    return merged;
  }

  async updateSuno(userId: string, settings: Partial<SunoSettings>) {
    const current = await this.getOrCreate(userId);
    const merged = { ...DEFAULT_SUNO, ...(current.sunoSettings as any || {}), ...settings };

    await prisma.userAudioSettings.update({
      where: { userId },
      data: { sunoSettings: merged as any },
    });

    logger.info(`Updated SUNO settings for user ${userId}`);
    return merged;
  }

  async updateSoundGen(userId: string, settings: Partial<SoundGenSettings>) {
    const current = await this.getOrCreate(userId);
    const merged = { ...DEFAULT_SOUND_GEN, ...(current.soundGenSettings as any || {}), ...settings };

    await prisma.userAudioSettings.update({
      where: { userId },
      data: { soundGenSettings: merged as any },
    });

    logger.info(`Updated Sound Generator settings for user ${userId}`);
    return merged;
  }

  getDefaults() {
    return {
      elevenLabsSettings: DEFAULT_ELEVENLABS,
      sunoSettings: DEFAULT_SUNO,
      soundGenSettings: DEFAULT_SOUND_GEN,
      voiceCloningSettings: DEFAULT_VOICE_CLONING,
    };
  }
}

export const audioSettingsService = new AudioSettingsService();
