import { Telegram } from 'telegraf';
import { STATUS_MESSAGES, getStatusType, StatusMessageSet } from '../utils/statusMessages';
import { logger } from '../utils/logger';

/**
 * Manages dynamic status messages during generation.
 * Auto-advances through stages on a timer, cycling with fresh
 * random variants so the user sees the message change in real-time.
 */
export class GenerationStatusManager {
  private telegram: Telegram;
  private chatId: number;
  private messageId: number;
  private modelName: string;
  private messages: StatusMessageSet;
  private currentStage: number;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private lastText: string = '';
  private stopped: boolean = false;
  private intervalMs: number = 4000;

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
    const statusType = getStatusType(opts.modelSlug);
    this.messages = STATUS_MESSAGES[statusType] || STATUS_MESSAGES.default;
    this.currentStage = 0;

    logger.info('[StatusManager] created', {
      chatId: opts.chatId,
      messageId: opts.messageId,
      modelSlug: opts.modelSlug,
      statusType,
      totalStages: this.messages.stages.length,
    });
  }

  private getRandomVariant(variants: string[]): string {
    return variants[Math.floor(Math.random() * variants.length)];
  }

  private formatMessage(text: string): string {
    if (!text) return '';
    return `🚀 <b>${this.escapeHtml(this.modelName)}</b>\n\n${text}`;
  }

  private escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private async editMessage(text: string): Promise<void> {
    if (this.stopped) return;
    // Skip if text is identical to what's already shown
    if (text === this.lastText) {
      logger.debug('[StatusManager] skip duplicate text', { chatId: this.chatId, messageId: this.messageId });
      return;
    }
    try {
      logger.info('[StatusManager] editing message', {
        chatId: this.chatId,
        messageId: this.messageId,
        stage: this.currentStage,
        textPreview: text.slice(0, 60),
      });
      await this.telegram.editMessageText(
        this.chatId,
        this.messageId,
        undefined,
        text,
        { parse_mode: 'HTML' },
      );
      this.lastText = text;
      logger.info('[StatusManager] edit success', { chatId: this.chatId, messageId: this.messageId, stage: this.currentStage });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // "message is not modified" is expected when text hasn't actually changed
      if (msg.includes('message is not modified')) {
        this.lastText = text; // sync to avoid repeated attempts
        logger.debug('[StatusManager] text unchanged (Telegram)', { chatId: this.chatId });
      } else {
        logger.error('[StatusManager] editMessageText failed', {
          chatId: this.chatId,
          messageId: this.messageId,
          stage: this.currentStage,
          error: msg,
        });
        // Stop auto-advance if the message was deleted or can't be edited
        if (msg.includes("can't be edited") || msg.includes('message to edit not found') || msg.includes('MESSAGE_ID_INVALID')) {
          this.stop();
        }
      }
    }
  }

  /** Advance to the next stage and schedule the following one */
  private async tick(): Promise<void> {
    if (this.stopped) return;

    this.currentStage++;
    if (this.currentStage >= this.messages.stages.length) {
      this.currentStage = 1; // cycle back (skip stage 0 which was the initial message)
    }

    const text = this.getRandomVariant(this.messages.stages[this.currentStage]);
    await this.editMessage(this.formatMessage(text));

    // Schedule next tick (recursive setTimeout avoids overlapping async calls)
    if (!this.stopped) {
      this.timer = setTimeout(() => this.tick(), this.intervalMs);
    }
  }

  /**
   * Start auto-advancing through status stages.
   * Stage 0 was already sent by the bot handler.
   * First advance to stage 1 fires immediately, then every intervalMs.
   */
  startAutoAdvance(intervalMs: number = 4000): void {
    if (this.messages.stages.length <= 1) {
      logger.info('[StatusManager] only 1 stage, skipping auto-advance');
      return;
    }
    this.intervalMs = intervalMs;
    this.currentStage = 0;

    logger.info('[StatusManager] starting auto-advance', {
      chatId: this.chatId,
      messageId: this.messageId,
      intervalMs,
      totalStages: this.messages.stages.length,
    });

    // First tick fires immediately — don't wait intervalMs for the first status change
    this.tick();
  }

  /** Stop the auto-advance timer */
  stop(): void {
    logger.info('[StatusManager] stopped', { chatId: this.chatId, messageId: this.messageId, stage: this.currentStage });
    this.stopped = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /** Show error message */
  async error(): Promise<void> {
    this.stop();
    const text = this.getRandomVariant(this.messages.error);
    await this.editMessage(this.formatMessage(text));
  }

  get totalStages(): number {
    return this.messages.stages.length;
  }

  get stage(): number {
    return this.currentStage;
  }
}
