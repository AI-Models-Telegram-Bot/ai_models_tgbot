import { create } from 'zustand';
import {
  chatApi,
  type ChatModel,
  type Conversation,
} from '@/services/api/chat.api';

export type Category = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO';
export type CreateStep = 'category' | 'model' | 'prompt' | 'generating' | 'result';

interface CreateState {
  /* Flow */
  step: CreateStep;
  selectedCategory: Category | null;
  selectedModel: ChatModel | null;

  /* Models */
  models: ChatModel[];
  isLoadingModels: boolean;

  /* Generation */
  conversationId: string | null;
  isGenerating: boolean;

  /* Result (single generation) */
  resultContent: string | null;
  resultFileUrl: string | null;
  resultStatus: 'PENDING' | 'STREAMING' | 'COMPLETED' | 'FAILED' | null;
  resultError: string | null;
  resultMessageId: string | null;

  /* History */
  history: Conversation[];
  isLoadingHistory: boolean;

  /* Actions */
  fetchModels: () => Promise<void>;
  selectCategory: (cat: Category) => void;
  selectModel: (model: ChatModel) => void;
  generate: (prompt: string) => Promise<void>;
  reset: () => void;
  goBack: () => void;
  fetchHistory: () => Promise<void>;
  createAnother: () => void;
  loadHistoryItem: (conversationId: string) => Promise<void>;

  /* Internal — called by SSE hook */
  _appendContent: (token: string) => void;
  _setResult: (patch: {
    resultFileUrl?: string | null;
    resultStatus?: 'PENDING' | 'STREAMING' | 'COMPLETED' | 'FAILED' | null;
    resultError?: string | null;
  }) => void;
}

const INITIAL_RESULT = {
  conversationId: null,
  isGenerating: false,
  resultContent: null,
  resultFileUrl: null,
  resultStatus: null,
  resultError: null,
  resultMessageId: null,
} as const;

export const useCreateStore = create<CreateState>((set, get) => ({
  /* Initial state */
  step: 'category',
  selectedCategory: null,
  selectedModel: null,
  models: [],
  isLoadingModels: false,
  ...INITIAL_RESULT,
  history: [],
  isLoadingHistory: false,

  /* ---- Actions ---- */

  fetchModels: async () => {
    if (get().models.length > 0) return; // already fetched
    set({ isLoadingModels: true });
    try {
      const models = await chatApi.getModels();
      set({ models: Array.isArray(models) ? models : [], isLoadingModels: false });
    } catch (err) {
      console.error('Failed to fetch models', err);
      set({ isLoadingModels: false });
    }
  },

  selectCategory: (cat) => {
    set({ selectedCategory: cat, selectedModel: null, step: 'model' });
  },

  selectModel: (model) => {
    set({ selectedModel: model, step: 'prompt', ...INITIAL_RESULT });
  },

  generate: async (prompt: string) => {
    const { selectedModel } = get();
    if (!selectedModel) return;

    set({
      step: 'generating',
      isGenerating: true,
      resultContent: null,
      resultFileUrl: null,
      resultStatus: 'PENDING',
      resultError: null,
      resultMessageId: null,
      conversationId: null,
    });

    try {
      // 1. Create a silent conversation
      const conversation = await chatApi.createConversation(selectedModel.slug);
      set({ conversationId: conversation.id });

      // 2. Send the message to trigger generation
      const resp = await chatApi.sendMessage(conversation.id, prompt);
      set({ resultMessageId: resp.assistantMessageId });

      // SSE hook will pick up conversationId and stream results
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.error ||
        err?.message ||
        'Generation failed';
      set({
        step: 'result',
        isGenerating: false,
        resultStatus: 'FAILED',
        resultError: errorMsg,
      });
    }
  },

  reset: () => {
    set({
      step: 'category',
      selectedCategory: null,
      selectedModel: null,
      ...INITIAL_RESULT,
    });
  },

  goBack: () => {
    const { step } = get();
    switch (step) {
      case 'model':
        set({ step: 'category', selectedCategory: null, selectedModel: null });
        break;
      case 'prompt':
        set({ step: 'model', selectedModel: null, ...INITIAL_RESULT });
        break;
      case 'result':
        set({ step: 'prompt', ...INITIAL_RESULT });
        break;
      default:
        break;
    }
  },

  createAnother: () => {
    set({ step: 'prompt', ...INITIAL_RESULT });
  },

  fetchHistory: async () => {
    set({ isLoadingHistory: true });
    try {
      const conversations = await chatApi.getConversations(50, 0);
      set({ history: Array.isArray(conversations) ? conversations : [], isLoadingHistory: false });
    } catch (err) {
      console.error('Failed to fetch history', err);
      set({ isLoadingHistory: false });
    }
  },

  loadHistoryItem: async (conversationId: string) => {
    try {
      const conv = await chatApi.getConversation(conversationId);
      const category = (conv.category || 'TEXT') as Category;
      const assistantMsg = conv.messages?.find((m) => m.role === 'ASSISTANT');
      const userMsg = conv.messages?.find((m) => m.role === 'USER');

      set({
        step: 'result',
        selectedCategory: category,
        selectedModel: null,
        conversationId: conv.id,
        isGenerating: false,
        resultContent: assistantMsg?.content || userMsg?.content || null,
        resultFileUrl: assistantMsg?.fileUrl || null,
        resultStatus: assistantMsg?.status === 'FAILED' ? 'FAILED' : 'COMPLETED',
        resultError: assistantMsg?.error || null,
        resultMessageId: assistantMsg?.id || null,
      });
    } catch (err) {
      console.error('Failed to load history item', err);
    }
  },

  /* ---- Internal (SSE) ---- */

  _appendContent: (token) => {
    set((s) => ({
      resultContent: (s.resultContent ?? '') + token,
      resultStatus: 'STREAMING',
    }));
  },

  _setResult: (patch) => {
    const updates: Partial<CreateState> = { ...patch };
    if (patch.resultStatus === 'COMPLETED' || patch.resultStatus === 'FAILED') {
      updates.step = 'result';
      updates.isGenerating = false;
    }
    set(updates);
  },
}));
