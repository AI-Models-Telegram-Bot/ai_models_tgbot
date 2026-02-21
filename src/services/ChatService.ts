import { WalletCategory } from '@prisma/client';
import { prisma } from '../config/database';
import { modelService } from './ModelService';
import { walletService } from './WalletService';
import { requestService } from './RequestService';
import { modelAccessService } from './ModelAccessService';
import { enqueueGeneration } from '../queues/producer';
import { config } from '../config';
import { logger } from '../utils/logger';

function toWalletCategory(category: string): WalletCategory {
  switch (category) {
    case 'TEXT': return 'TEXT';
    case 'IMAGE': return 'IMAGE';
    case 'VIDEO': return 'VIDEO';
    case 'AUDIO': return 'AUDIO';
    default: return 'TEXT';
  }
}

export class ChatService {
  /**
   * Create a new conversation for a user with a specific model.
   */
  async createConversation(userId: string, modelSlug: string, title?: string) {
    const model = await modelService.getBySlug(modelSlug);
    if (!model) {
      throw new Error(`Model not found: ${modelSlug}`);
    }

    const conversation = await prisma.conversation.create({
      data: {
        userId,
        modelSlug: model.slug,
        category: model.category,
        title: title || `Chat with ${model.name}`,
      },
    });

    return conversation;
  }

  /**
   * Send a message in a conversation. Validates ownership, deducts credits,
   * creates records, and enqueues the generation job.
   */
  async sendMessage(conversationId: string, userId: string, content: string, fileUrl?: string) {
    // Get conversation and validate ownership
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }
    if (conversation.userId !== userId) {
      throw new Error('Unauthorized: conversation does not belong to user');
    }

    // Get model
    const model = await modelService.getBySlug(conversation.modelSlug);
    if (!model) {
      throw new Error(`Model not found: ${conversation.modelSlug}`);
    }

    const walletCat = toWalletCategory(model.category);
    const priceItemCode = modelService.getPriceItemCode(model.slug);
    const creditsCost = model.tokenCost;

    // Check model access for user's subscription tier
    const access = await modelAccessService.canUseModel(userId, model.slug, walletCat);
    if (!access.allowed) {
      throw new Error(access.reason || 'Model access denied for your subscription tier');
    }

    // Check and deduct wallet balance (skip if unlimited)
    if (!access.unlimited) {
      const hasBalance = await walletService.hasSufficientBalance(userId, creditsCost);
      if (!hasBalance) {
        const currentBalance = await walletService.getBalance(userId);
        throw new Error(
          `Insufficient balance. Required: ${creditsCost}, Available: ${currentBalance}`
        );
      }
    }

    // Create Request record
    const request = await requestService.create({
      userId,
      modelId: model.id,
      inputText: content,
      tokensCost: creditsCost,
    });

    // Deduct credits (skip if unlimited)
    if (!access.unlimited) {
      await walletService.deductCredits(userId, walletCat, creditsCost, {
        requestId: request.id,
        priceItemCode,
        description: `${model.name} generation (web chat)`,
      });
    }

    // Save user ChatMessage
    const userMessage = await prisma.chatMessage.create({
      data: {
        conversationId,
        role: 'USER',
        content,
        fileUrl: fileUrl || null,
        status: 'COMPLETED',
      },
    });

    // Create assistant ChatMessage (status: PENDING) — will be updated by worker
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        conversationId,
        role: 'ASSISTANT',
        content: null,
        requestId: request.id,
        status: 'PENDING',
      },
    });

    // Update conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Enqueue generation job with web source
    try {
      await enqueueGeneration({
        requestId: request.id,
        userId,
        chatId: 0, // Not used for web source
        modelSlug: model.slug,
        modelCategory: model.category,
        provider: model.provider,
        input: content,
        processingMsgId: 0, // Not used for web source
        language: 'en', // Default for web; could be parameterized later
        creditsCost,
        priceItemCode,
        walletCategory: walletCat,
        botToken: config.bot.token,
        source: 'web',
        webMessageId: assistantMessage.id,
      });

      logger.info('Web chat job enqueued', {
        requestId: request.id,
        conversationId,
        model: model.slug,
      });
    } catch (error) {
      logger.error('Failed to enqueue web chat job:', error);

      // Refund credits if enqueue fails (skip if unlimited)
      if (!access.unlimited) {
        try {
          await walletService.refundCredits(userId, walletCat, creditsCost, {
            requestId: request.id,
            priceItemCode,
            description: 'Refund: failed to enqueue web chat job',
          });
        } catch (refundError) {
          logger.error('Failed to refund credits after enqueue failure', { refundError });
        }
      }

      // Mark assistant message as failed
      await prisma.chatMessage.update({
        where: { id: assistantMessage.id },
        data: { status: 'FAILED', content: 'Failed to process request' },
      });

      throw new Error('Failed to process request');
    }

    return {
      userMessageId: userMessage.id,
      assistantMessageId: assistantMessage.id,
      requestId: request.id,
    };
  }

  /**
   * List conversations for a user, ordered by most recent, with last message preview.
   */
  async getConversations(userId: string, limit = 20, offset = 0) {
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            role: true,
            content: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    return conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      modelSlug: conv.modelSlug,
      category: conv.category,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      lastMessage: conv.messages[0] || null,
    }));
  }

  /**
   * Get messages for a conversation. Validates ownership.
   */
  async getMessages(conversationId: string, userId: string, limit = 50, offset = 0) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }
    if (conversation.userId !== userId) {
      throw new Error('Unauthorized: conversation does not belong to user');
    }

    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
    });

    return messages;
  }

  /**
   * Delete a conversation and all its messages. Validates ownership.
   */
  async deleteConversation(conversationId: string, userId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }
    if (conversation.userId !== userId) {
      throw new Error('Unauthorized: conversation does not belong to user');
    }

    // Cascade delete is configured in schema, so deleting conversation removes messages
    await prisma.conversation.delete({
      where: { id: conversationId },
    });

    return { deleted: true };
  }
}

export const chatService = new ChatService();
