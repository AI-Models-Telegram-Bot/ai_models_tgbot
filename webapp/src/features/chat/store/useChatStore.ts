import { create } from 'zustand';
import {
  chatApi,
  type ChatModel,
  type Conversation,
  type Message,
} from '@/services/api/chat.api';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ChatState {
  /* Data */
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  availableModels: ChatModel[];

  /* Loading flags */
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;

  /* SSE */
  _eventSource: EventSource | null;

  /* Actions */
  fetchModels: () => Promise<void>;
  fetchConversations: () => Promise<void>;
  createConversation: (modelSlug: string, title?: string) => Promise<Conversation>;
  selectConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  connectSSE: (conversationId: string) => void;
  disconnectSSE: () => void;
  clearActive: () => void;

  /* Internal helpers (called by SSE hook) */
  _updateMessage: (messageId: string, patch: Partial<Message>) => void;
  _appendContentToMessage: (messageId: string, token: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

export const useChatStore = create<ChatState>((set, get) => ({
  /* ---- initial state ---- */
  conversations: [],
  activeConversation: null,
  messages: [],
  availableModels: [],

  isLoadingConversations: false,
  isLoadingMessages: false,
  isSending: false,

  _eventSource: null,

  /* ---- actions ---- */

  fetchModels: async () => {
    try {
      const models = await chatApi.getModels();
      set({ availableModels: Array.isArray(models) ? models : [] });
    } catch (err) {
      console.error('Failed to fetch models', err);
    }
  },

  fetchConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      const conversations = await chatApi.getConversations(50, 0);
      set({ conversations: Array.isArray(conversations) ? conversations : [], isLoadingConversations: false });
    } catch (err) {
      console.error('Failed to fetch conversations', err);
      set({ isLoadingConversations: false });
    }
  },

  createConversation: async (modelSlug: string, title?: string) => {
    const conversation = await chatApi.createConversation(modelSlug, title);
    set((s) => ({
      conversations: [conversation, ...s.conversations],
      activeConversation: conversation,
      messages: [],
    }));
    // Connect SSE for real-time updates
    get().connectSSE(conversation.id);
    return conversation;
  },

  selectConversation: async (id: string) => {
    // Disconnect previous SSE if any
    get().disconnectSSE();

    set({ isLoadingMessages: true });
    try {
      const data = await chatApi.getConversation(id);
      set({
        activeConversation: {
          id: data.id,
          modelSlug: data.modelSlug,
          category: data.category,
          title: data.title,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        },
        messages: data.messages,
        isLoadingMessages: false,
      });
      // Connect SSE for this conversation
      get().connectSSE(id);
    } catch (err) {
      console.error('Failed to load conversation', err);
      set({ isLoadingMessages: false });
    }
  },

  deleteConversation: async (id: string) => {
    try {
      await chatApi.deleteConversation(id);
      const { activeConversation } = get();
      set((s) => ({
        conversations: s.conversations.filter((c) => c.id !== id),
        ...(activeConversation?.id === id
          ? { activeConversation: null, messages: [] }
          : {}),
      }));
      if (activeConversation?.id === id) {
        get().disconnectSSE();
      }
    } catch (err) {
      console.error('Failed to delete conversation', err);
    }
  },

  sendMessage: async (content: string) => {
    const { activeConversation } = get();
    if (!activeConversation) return;

    set({ isSending: true });
    try {
      const resp = await chatApi.sendMessage(activeConversation.id, content);

      // Optimistically add user + pending assistant message
      const now = new Date().toISOString();
      const userMsg: Message = {
        id: resp.userMessageId,
        conversationId: activeConversation.id,
        role: 'USER',
        content,
        fileUrl: null,
        status: 'COMPLETED',
        error: null,
        createdAt: now,
      };
      const assistantMsg: Message = {
        id: resp.assistantMessageId,
        conversationId: activeConversation.id,
        role: 'ASSISTANT',
        content: null,
        fileUrl: null,
        status: 'PENDING',
        error: null,
        createdAt: now,
      };

      set((s) => ({
        messages: [...s.messages, userMsg, assistantMsg],
        isSending: false,
      }));
    } catch (err) {
      console.error('Failed to send message', err);
      set({ isSending: false });
    }
  },

  connectSSE: (conversationId: string) => {
    // Handled externally by the useSSE hook — this is a no-op placeholder.
    // The hook reads conversationId and manages EventSource lifecycle.
    void conversationId;
  },

  disconnectSSE: () => {
    const es = get()._eventSource;
    if (es) {
      es.close();
      set({ _eventSource: null });
    }
  },

  clearActive: () => {
    get().disconnectSSE();
    set({ activeConversation: null, messages: [] });
  },

  /* ---- internal helpers (called by SSE) ---- */

  _updateMessage: (messageId: string, patch: Partial<Message>) => {
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === messageId ? { ...m, ...patch } : m,
      ),
    }));
  },

  _appendContentToMessage: (messageId: string, token: string) => {
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === messageId
          ? { ...m, content: (m.content ?? '') + token }
          : m,
      ),
    }));
  },
}));
