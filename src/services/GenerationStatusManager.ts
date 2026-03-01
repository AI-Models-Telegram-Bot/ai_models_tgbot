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
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastText: string = '';
  private stopped: boolean = false;

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

  private async updateMessage(text: string): Promise<void> {
    if (this.stopped) return;
    // Skip if text is identical to what's already shown
    if (text === this.lastText) return;
    try {
      await this.telegram.editMessageText(
        this.chatId,
        this.messageId,
        undefined,
        text,
        { parse_mode: 'HTML' },
      );
      this.lastText = text;
    } catch {
      // Message might be deleted or text unchanged — ignore
    }
  }

  /**
   * Start auto-advancing through status stages on a timer.
   * Begins at stage 1 (stage 0 is already sent by the bot handler).
   * Cycles back to stage 1 when all stages are exhausted, picking fresh random variants.
   */
  startAutoAdvance(intervalMs: number = 4000): void {
    if (this.messages.stages.length <= 1) return;
    this.currentStage = 0; // will advance to 1 on first tick

    this.timer = setInterval(async () => {
      if (this.stopped) {
        this.clearTimer();
        return;
      }

      this.currentStage++;
      // Cycle back to stage 1 when we've gone through all stages
      if (this.currentStage >= this.messages.stages.length) {
        this.currentStage = 1;
      }

      const text = this.getRandomVariant(this.messages.stages[this.currentStage]);
      await this.updateMessage(this.formatMessage(text));
    }, intervalMs);
  }

  /** Stop the auto-advance timer */
  stop(): void {
    this.stopped = true;
    this.clearTimer();
  }

  private clearTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Show error message */
  async error(): Promise<void> {
    this.stop();
    const text = this.getRandomVariant(this.messages.error);
    await this.updateMessage(this.formatMessage(text));
  }

  get totalStages(): number {
    return this.messages.stages.length;
  }

  get stage(): number {
    return this.currentStage;
  }
}
