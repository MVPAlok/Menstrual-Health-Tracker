import { Request, Response } from 'express';
import prisma from '../prisma';
import { processUserMessage } from '../services/geminiService';

/**
 * GET /api/chat/history
 * Fetches the persistent conversation history for the authenticated user.
 */
export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized user' });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 50,
      select: {
        id: true,
        role: true,
        content: true,
        suggestedFollowUps: true,
        contextSnapshot: true,
        createdAt: true,
      },
    });

    return res.status(200).json({ messages });
  } catch (error: any) {
    console.error('❌ [ChatController] Error fetching chat history:', error);
    return res.status(500).json({ error: 'Failed to retrieve chat history' });
  }
};

/**
 * POST /api/chat/message
 * Processes a new user prompt via Gemini with real-time biometric context,
 * persists the conversation to PostgreSQL, and returns the response with follow-up suggestions.
 */
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized user' });
    }

    const { message } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const cleanMessage = message.trim();
    if (cleanMessage.length > 2000) {
      return res.status(400).json({ error: 'Message exceeds maximum length of 2000 characters' });
    }

    // 1. Persist User Message to DB
    const userRecord = await prisma.chatMessage.create({
      data: {
        userId,
        role: 'user',
        content: cleanMessage,
      },
    });

    // 2. Process query via Gemini Intelligence Engine
    const result = await processUserMessage(userId, cleanMessage);

    // 3. Persist Assistant Response with follow-up suggestions and biometric context snapshot
    const assistantRecord = await prisma.chatMessage.create({
      data: {
        userId,
        role: 'assistant',
        content: result.reply,
        suggestedFollowUps: result.suggestedFollowUps || [],
        contextSnapshot: result.contextSnapshot || undefined,
      },
    });

    return res.status(200).json({
      reply: result.reply,
      suggestedFollowUps: result.suggestedFollowUps,
      contextSnapshot: result.contextSnapshot,
      loggedData: result.loggedData,
      userMessageId: userRecord.id,
      messageId: assistantRecord.id,
      createdAt: assistantRecord.createdAt,
    });
  } catch (error: any) {
    console.error('❌ [ChatController] Error processing chat message:', error);
    return res.status(500).json({ error: 'Failed to process chat message' });
  }
};

/**
 * DELETE /api/chat/history
 * Clears the user's conversation history.
 */
export const clearChatHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized user' });
    }

    await prisma.chatMessage.deleteMany({
      where: { userId },
    });

    return res.status(200).json({ success: true, message: 'Chat history cleared successfully' });
  } catch (error: any) {
    console.error('❌ [ChatController] Error clearing chat history:', error);
    return res.status(500).json({ error: 'Failed to clear chat history' });
  }
};

