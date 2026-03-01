import { Telegram } from 'telegraf';
import { STATUS_MESSAGES, getStatusType, StatusMessageSet } from '../utils/statusMessages';
import { logger } from '../utils/logger';

/**
 * Manages dynamic status messages during generation.
 * Updates the same Telegram message with progress stages,
 * using random variant selection for natural-feeling messages.
 */
export class GenerationStatusManager {
  private telegram: Telegram;
  private chatId: number;
  private messageId: number;
  private statusType: string;
  private modelName: string;
  private currentStage: number;
  private messages: StatusMessageSet;

  constructor(opts: {
    telegram: Telegram;
    chatId: number;
    messageId: number;
    modelSlug: string;
    modelName: string;
  }) {
    this.telegram = opts.telegram;
    this.chatId = opts.chatId;
    this.messageId = opts.messageId;
    this.modelName = opts.modelName;
    this.statusType = getStatusType(opts.modelSlug);
    this.messages = STATUS_MESSAGES[this.statusType] || STATUS_MESSAGES.default;
    this.currentStage = 0;
  }

  /** Get a random variant from a stage's message array */
  private getRandomVariant(variants: string[]): string {
    return variants[Math.floor(Math.random() * variants.length)];
  }

  /** Format the status message with model name header */
  private formatMessage(text: string): string {
    if (!text) return '';
    return `🚀 <b>${this.escapeHtml(this.modelName)}</b>\n\n${text}`;
  }

  private escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /** Update the processing message text */
  private async updateMessage(text: string): Promise<void> {
    try {
      await this.telegram.editMessageText(
        this.chatId,
        this.messageId,
        undefined,
        text,
        { parse_mode: 'HTML' },
      );
    } catch {
      // Message might be the same text or already deleted — ignore
    }
  }

  /** Set the initial status message (stage 0) */
  async start(): Promise<void> {
    if (this.messages.stages.length === 0) return;
    const text = this.getRandomVariant(this.messages.stages[0]);
    await this.updateMessage(this.formatMessage(text));
    this.currentStage = 0;
  }

  /** Advance to the next stage */
  async nextStage(): Promise<void> {
    this.currentStage++;
    if (this.currentStage < this.messages.stages.length) {
      const text = this.getRandomVariant(this.messages.stages[this.currentStage]);
      await this.updateMessage(this.formatMessage(text));
    }
  }

  /** Show completion message */
  async complete(): Promise<void> {
    const text = this.getRandomVariant(this.messages.complete);
    if (text) {
      await this.updateMessage(this.formatMessage(text));
    }
  }

  /** Show error message */
  async error(): Promise<void> {
    const text = this.getRandomVariant(this.messages.error);
    await this.updateMessage(this.formatMessage(text));
  }

  /** Get the total number of stages for this model type */
  get totalStages(): number {
    return this.messages.stages.length;
  }

  /** Get current stage index */
  get stage(): number {
    return this.currentStage;
  }
}
