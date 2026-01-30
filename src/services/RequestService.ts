import { Request, RequestStatus } from '@prisma/client';
import { prisma } from '../config/database';

export class RequestService {
  /**
   * Create a request record. Balance check and deduction are handled
   * by the bot handler using WalletService before calling this method.
   */
  async create(data: {
    userId: string;
    modelId: string;
    inputText?: string;
    inputFileId?: string;
    tokensCost: number;
  }): Promise<Request> {
    return prisma.request.create({
      data: {
        userId: data.userId,
        modelId: data.modelId,
        inputText: data.inputText,
        inputFileId: data.inputFileId,
        tokensCost: data.tokensCost,
        status: 'PENDING',
      },
    });
  }

  async updateStatus(
    requestId: string,
    status: RequestStatus,
    result?: { outputText?: string; outputFileUrl?: string; errorMessage?: string; actualProvider?: string }
  ): Promise<Request> {
    return prisma.request.update({
      where: { id: requestId },
      data: {
        status,
        outputText: result?.outputText,
        outputFileUrl: result?.outputFileUrl,
        errorMessage: result?.errorMessage,
        actualProvider: result?.actualProvider,
        completedAt: status === 'COMPLETED' || status === 'FAILED' ? new Date() : undefined,
      },
    });
  }

  async markProcessing(requestId: string): Promise<Request> {
    return this.updateStatus(requestId, 'PROCESSING');
  }

  async markCompleted(requestId: string, output: { text?: string; fileUrl?: string; actualProvider?: string }): Promise<Request> {
    return this.updateStatus(requestId, 'COMPLETED', {
      outputText: output.text,
      outputFileUrl: output.fileUrl,
      actualProvider: output.actualProvider,
    });
  }

  /**
   * Mark request as failed. Refund is handled by the bot handler via WalletService.
   */
  async markFailed(requestId: string, errorMessage: string, _refundTokens = true): Promise<Request> {
    return this.updateStatus(requestId, 'FAILED', { errorMessage });
  }

  async getUserHistory(userId: string, limit = 10): Promise<Request[]> {
    return prisma.request.findMany({
      where: { userId },
      include: { model: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const requestService = new RequestService();
