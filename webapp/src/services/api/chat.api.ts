import apiClient from './client';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ChatModel {
  id: string;
  name: string;
  slug: string;
  category: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO';
  description: string | null;
}

export interface Conversation {
  id: string;
  modelSlug: string;
  category: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO';
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'USER' | 'ASSISTANT';
  content: string | null;
  fileUrl: string | null;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  error: string | null;
  createdAt: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export interface SendMessageResponse {
  userMessageId: string;
  assistantMessageId: string;
  requestId: string;
}

/* ------------------------------------------------------------------ */
/*  API                                                                */
/* ------------------------------------------------------------------ */

export const chatApi = {
  /** List available chat models */
  getModels: () =>
    apiClient
      .get<{ models: ChatModel[] }>('/api/web/chat/models')
      .then((r) => r.data),

  /** List conversations (paginated) */
  getConversations: (limit = 20, offset = 0) =>
    apiClient
      .get<{ conversations: Conversation[]; total: number }>(
        '/api/web/chat/conversations',
        { params: { limit, offset } },
      )
      .then((r) => r.data),

  /** Get a single conversation with its messages */
  getConversation: (id: string) =>
    apiClient
      .get<ConversationWithMessages>(`/api/web/chat/conversations/${id}`)
      .then((r) => r.data),

  /** Create a new conversation */
  createConversation: (modelSlug: string, title?: string) =>
    apiClient
      .post<Conversation>('/api/web/chat/conversations', { modelSlug, title })
      .then((r) => r.data),

  /** Delete a conversation */
  deleteConversation: (id: string) =>
    apiClient.delete(`/api/web/chat/conversations/${id}`),

  /** Send a message inside a conversation */
  sendMessage: (conversationId: string, content: string) =>
    apiClient
      .post<SendMessageResponse>(
        `/api/web/chat/conversations/${conversationId}/messages`,
        { content },
      )
      .then((r) => r.data),

  /** Build the SSE stream URL for a conversation */
  getStreamUrl: (conversationId: string) =>
    `${import.meta.env.VITE_API_URL}/api/web/chat/conversations/${conversationId}/stream`,
};
