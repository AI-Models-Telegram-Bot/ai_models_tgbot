import { Router, Request, Response } from 'express';
import Redis from 'ioredis';
import { chatService } from '../services/ChatService';
import { modelService, modelAccessService } from '../services';
import { config } from '../config';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

// ── Conversations ────────────────────────────────────────

/**
 * POST /conversations
 * Create a new conversation.
 */
router.post('/conversations', async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { modelSlug, title } = req.body;

  if (!modelSlug) {
    return res.status(400).json({ message: 'modelSlug is required' });
  }

  try {
    const conversation = await chatService.createConversation(req.user.id, modelSlug, title);
    return res.status(201).json(conversation);
  } catch (error: any) {
    logger.error('Failed to create conversation', { error: error.message });
    if (error.message.startsWith('Model not found')) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Failed to create conversation' });
  }
});

/**
 * GET /conversations
 * List user's conversations with last message preview.
 */
router.get('/conversations', async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const limit = parseInt(String(req.query.limit || '20'), 10) || 20;
  const offset = parseInt(String(req.query.offset || '0'), 10) || 0;

  try {
    const conversations = await chatService.getConversations(req.user.id, limit, offset);
    return res.json(conversations);
  } catch (error: any) {
    logger.error('Failed to list conversations', { error: error.message });
    return res.status(500).json({ message: 'Failed to list conversations' });
  }
});

/**
 * GET /conversations/:id
 * Get a conversation with its messages.
 */
router.get('/conversations/:id', async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const id = String(req.params.id);
  const limit = parseInt(String(req.query.limit || '50'), 10) || 50;
  const offset = parseInt(String(req.query.offset || '0'), 10) || 0;

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    if (conversation.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const messages = await chatService.getMessages(id, req.user.id, limit, offset);

    return res.json({
      ...conversation,
      messages,
    });
  } catch (error: any) {
    logger.error('Failed to get conversation', { error: error.message });
    return res.status(500).json({ message: 'Failed to get conversation' });
  }
});

/**
 * DELETE /conversations/:id
 * Delete a conversation and all its messages.
 */
router.delete('/conversations/:id', async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const id = String(req.params.id);

  try {
    await chatService.deleteConversation(id, req.user.id);
    return res.json({ message: 'Conversation deleted' });
  } catch (error: any) {
    logger.error('Failed to delete conversation', { error: error.message });
    if (error.message === 'Conversation not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.startsWith('Unauthorized')) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return res.status(500).json({ message: 'Failed to delete conversation' });
  }
});

// ── Messages ─────────────────────────────────────────────

/**
 * POST /conversations/:id/messages
 * Send a message in a conversation. Triggers AI generation.
 */
router.post('/conversations/:id/messages', async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const id = String(req.params.id);
  const { content, fileUrl } = req.body;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ message: 'content is required' });
  }

  try {
    const result = await chatService.sendMessage(id, req.user.id, content.trim(), fileUrl);
    return res.status(201).json(result);
  } catch (error: any) {
    logger.error('Failed to send message', { error: error.message });

    if (error.message === 'Conversation not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.startsWith('Unauthorized')) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (error.message.startsWith('Insufficient')) {
      return res.status(402).json({ message: error.message });
    }
    if (error.message.startsWith('Model access denied')) {
      return res.status(403).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message || 'Failed to send message' });
  }
});

// ── SSE Stream ───────────────────────────────────────────

/**
 * GET /conversations/:id/stream
 * Server-Sent Events endpoint for real-time chat updates.
 * Subscribes to Redis pub/sub and forwards relevant events.
 */
router.get('/conversations/:id/stream', async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const conversationId = String(req.params.id);

  // Validate conversation ownership
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    if (conversation.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
  } catch (error: any) {
    logger.error('Failed to validate conversation for SSE', { error: error.message });
    return res.status(500).json({ message: 'Internal server error' });
  }

  // Collect all message IDs belonging to this conversation so we can filter events.
  // We also listen for newly created messages during the session.
  const messageIds = new Set<string>();
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      select: { id: true },
    });
    for (const m of messages) {
      messageIds.add(m.id);
    }
  } catch (error) {
    logger.error('Failed to load message IDs for SSE', { error });
  }

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable nginx buffering
  });

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: 'connected', conversationId })}\n\n`);

  // Create a dedicated Redis subscriber connection for this SSE client.
  // We cannot reuse the shared Redis connection for pub/sub because
  // ioredis enters subscriber mode and blocks other commands.
  const subscriber = new Redis(config.redis.url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  const channel = 'chat:updates';

  const messageHandler = (_ch: string, message: string) => {
    try {
      const data = JSON.parse(message);

      // Only forward events for messages in this conversation
      if (data.messageId && messageIds.has(data.messageId)) {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    } catch (parseErr) {
      logger.error('Failed to parse SSE message from Redis', { parseErr });
    }
  };

  subscriber.subscribe(channel).catch((err) => {
    logger.error('Failed to subscribe to Redis channel for SSE', { err });
  });
  subscriber.on('message', messageHandler);

  // Heartbeat to keep connection alive
  const heartbeatInterval = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 15000);

  // Periodically refresh message IDs to include newly created messages
  const refreshInterval = setInterval(async () => {
    try {
      const messages = await prisma.chatMessage.findMany({
        where: { conversationId },
        select: { id: true },
      });
      for (const m of messages) {
        messageIds.add(m.id);
      }
    } catch {
      // Ignore refresh errors
    }
  }, 5000);

  // Cleanup on client disconnect
  const cleanup = () => {
    clearInterval(heartbeatInterval);
    clearInterval(refreshInterval);
    subscriber.unsubscribe(channel).catch(() => {});
    subscriber.quit().catch(() => {});
  };

  req.on('close', cleanup);
  req.on('error', cleanup);
});

// ── Models ───────────────────────────────────────────────

/**
 * GET /models
 * List available AI models for the authenticated user's subscription tier.
 */
router.get('/models', async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const allModels = await modelService.getAll();

    // Check access for each model against user's subscription
    const modelsWithAccess = await Promise.all(
      allModels.map(async (model) => {
        const walletCat = model.category as 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO';
        const access = await modelAccessService.canUseModel(req.user!.id, model.slug, walletCat);
        return {
          id: model.id,
          name: model.name,
          slug: model.slug,
          category: model.category,
          provider: model.provider,
          description: model.description,
          tokenCost: model.tokenCost,
          isActive: model.isActive,
          hasAccess: access.allowed,
          isUnlimited: access.unlimited,
        };
      })
    );

    return res.json(modelsWithAccess);
  } catch (error: any) {
    logger.error('Failed to list models', { error: error.message });
    return res.status(500).json({ message: 'Failed to list models' });
  }
});

export default router;
