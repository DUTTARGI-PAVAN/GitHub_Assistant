import { PrismaClient } from '@prisma/client';
import { queryRepository } from '../services/ragService.js';

const prisma = new PrismaClient();

/**
 * Handle user chat query against a repository RAG index
 */
export const sendChatMessage = async (req, res) => {
  try {
    const { repositoryId, chatSessionId, message } = req.body;

    if (!repositoryId || !message) {
      return res.status(400).json({ error: 'repositoryId and message are required.' });
    }

    // Verify repository exists and is indexed
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
    });

    if (!repository) {
      return res.status(404).json({ error: 'Repository not found.' });
    }

    // Resolve or create chat session
    let session;
    if (chatSessionId) {
      session = await prisma.chatSession.findUnique({
        where: { id: chatSessionId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 10,
          },
        },
      });
    }

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          repositoryId,
          title: message.slice(0, 40) + '...',
        },
        include: {
          messages: true,
        },
      });
    }

    // Store user message
    const userMessage = await prisma.chatMessage.create({
      data: {
        chatSessionId: session.id,
        role: 'USER',
        content: message,
      },
    });

    // Query RAG pipeline
    const { answer, sources } = await queryRepository({
      repositoryId,
      query: message,
      conversationHistory: session.messages || [],
    });

    // Store assistant response
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        chatSessionId: session.id,
        role: 'ASSISTANT',
        content: answer,
        sources: sources,
      },
    });

    return res.json({
      sessionId: session.id,
      userMessage,
      assistantMessage,
    });
  } catch (error) {
    console.error('Error in sendChatMessage:', error);
    return res.status(500).json({ error: error.message || 'Internal error' });
  }
};

/**
 * Get chat history for a session or repository
 */
export const getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    return res.json({ session });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export default {
  sendChatMessage,
  getChatHistory,
};
