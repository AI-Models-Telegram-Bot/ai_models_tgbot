import { create } from 'zustand';
import {
  chatApi,
  type ChatModel,
} from '@/services/api/chat.api';

export type Category = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO';
export type SectionStep = 'model' | 'prompt' | 'generating' | 'result';

interface SectionState {
  step: SectionStep;
  selectedModel: ChatModel | null;
  conversationId: string | null;
  isGenerating: boolean;
  resultContent: string | null;
  resultFileUrl: string | null;
  resultStatus: 'PENDING' | 'STREAMING' | 'COMPLETED' | 'FAILED' | null;
  resultError: string | null;
  resultMessageId: string | null;
  /** Number of unseen completed results */
  unseenCount: number;
}

const INITIAL_SECTION: SectionState = {
  step: 'model',
  selectedModel: null,
  conversationId: null,
  isGenerating: false,
  resultContent: null,
  resultFileUrl: null,
  resultStatus: null,
  resultError: null,
  resultMessageId: null,
  unseenCount: 0,
};

interface SectionsStore {
  activeSection: Category;
  sections: Record<Category, SectionState>;

  /* Models (shared across sections) */
  models: ChatModel[];
  isLoadingModels: boolean;

  /* Actions */
  setActiveSection: (cat: Category) => void;
  fetchModels: () => Promise<void>;

  /* Per-section actions */
  selectModel: (cat: Category, model: ChatModel) => void;
  switchModel: (cat: Category, model: ChatModel) => void;
  generate: (cat: Category, prompt: string, fileUrl?: string) => Promise<void>;
  resetSection: (cat: Category) => void;
  createAnother: (cat: Category) => void;
  goBack: (cat: Category) => void;

  /* SSE callbacks — called by per-section SSE hooks */
  _appendContent: (cat: Category, token: string) => void;
  _setResult: (cat: Category, patch: Partial<Pick<SectionState, 'resultFileUrl' | 'resultStatus' | 'resultError'>>) => void;
}

const STORAGE_KEY = 'vseonix_active_section';

function loadActiveSection(): Category {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ['TEXT', 'IMAGE', 'VIDEO', 'AUDIO'].includes(saved)) {
      return saved as Category;
    }
  } catch {}
  return 'IMAGE';
}

function updateSection(
  state: SectionsStore,
  cat: Category,
  patch: Partial<SectionState>,
): Partial<SectionsStore> {
  return {
    sections: {
      ...state.sections,
      [cat]: { ...state.sections[cat], ...patch },
    },
  };
}

export const useSectionsStore = create<SectionsStore>((set, get) => ({
  activeSection: loadActiveSection(),
  sections: {
    TEXT: { ...INITIAL_SECTION },
    IMAGE: { ...INITIAL_SECTION },
    VIDEO: { ...INITIAL_SECTION },
    AUDIO: { ...INITIAL_SECTION },
  },
  models: [],
  isLoadingModels: false,

  setActiveSection: (cat) => {
    localStorage.setItem(STORAGE_KEY, cat);
    // Clear unseen count when switching to section
    set((s) => ({
      activeSection: cat,
      ...updateSection(s, cat, { unseenCount: 0 }),
    }));
  },

  fetchModels: async () => {
    if (get().models.length > 0) return;
    set({ isLoadingModels: true });
    try {
      const models = await chatApi.getModels();
      set({ models: Array.isArray(models) ? models : [], isLoadingModels: false });
    } catch (err) {
      console.error('Failed to fetch models', err);
      set({ isLoadingModels: false });
    }
  },

  selectModel: (cat, model) => {
    set((s) => updateSection(s, cat, {
      selectedModel: model,
      step: 'prompt',
      conversationId: null,
      isGenerating: false,
      resultContent: null,
      resultFileUrl: null,
      resultStatus: null,
      resultError: null,
      resultMessageId: null,
    }));
  },

  switchModel: (cat, model) => {
    const section = get().sections[cat];
    if (section.step === 'prompt' || section.step === 'result') {
      set((s) => updateSection(s, cat, { selectedModel: model }));
    } else {
      set((s) => updateSection(s, cat, {
        selectedModel: model,
        step: 'prompt',
        conversationId: null,
        isGenerating: false,
        resultContent: null,
        resultFileUrl: null,
        resultStatus: null,
        resultError: null,
        resultMessageId: null,
      }));
    }
  },

  generate: async (cat, prompt, fileUrl?) => {
    const section = get().sections[cat];
    if (!section.selectedModel) return;

    set((s) => updateSection(s, cat, {
      step: 'generating',
      isGenerating: true,
      resultContent: null,
      resultFileUrl: null,
      resultStatus: 'PENDING',
      resultError: null,
      resultMessageId: null,
      conversationId: null,
    }));

    try {
      const conversation = await chatApi.createConversation(section.selectedModel.slug);
      set((s) => updateSection(s, cat, { conversationId: conversation.id }));

      const resp = await chatApi.sendMessage(conversation.id, prompt, fileUrl);
      set((s) => updateSection(s, cat, { resultMessageId: resp.assistantMessageId }));
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.error ||
        err?.message ||
        'Generation failed';
      set((s) => updateSection(s, cat, {
        step: 'result',
        isGenerating: false,
        resultStatus: 'FAILED',
        resultError: errorMsg,
      }));
    }
  },

  resetSection: (cat) => {
    set((s) => updateSection(s, cat, { ...INITIAL_SECTION }));
  },

  createAnother: (cat) => {
    set((s) => updateSection(s, cat, {
      step: 'prompt',
      conversationId: null,
      isGenerating: false,
      resultContent: null,
      resultFileUrl: null,
      resultStatus: null,
      resultError: null,
      resultMessageId: null,
    }));
  },

  goBack: (cat) => {
    const section = get().sections[cat];
    switch (section.step) {
      case 'prompt':
        set((s) => updateSection(s, cat, {
          step: 'model',
          selectedModel: null,
          conversationId: null,
          isGenerating: false,
          resultContent: null,
          resultFileUrl: null,
          resultStatus: null,
          resultError: null,
          resultMessageId: null,
        }));
        break;
      case 'result':
        set((s) => updateSection(s, cat, {
          step: 'prompt',
          conversationId: null,
          isGenerating: false,
          resultContent: null,
          resultFileUrl: null,
          resultStatus: null,
          resultError: null,
          resultMessageId: null,
        }));
        break;
    }
  },

  _appendContent: (cat, token) => {
    set((s) => {
      const section = s.sections[cat];
      return updateSection(s, cat, {
        resultContent: (section.resultContent ?? '') + token,
        resultStatus: 'STREAMING',
      });
    });
  },

  _setResult: (cat, patch) => {
    set((s) => {
      const updates: Partial<SectionState> = { ...patch };
      if (patch.resultStatus === 'COMPLETED' || patch.resultStatus === 'FAILED') {
        updates.step = 'result';
        updates.isGenerating = false;
        // If user is on a different section, increment unseen count
        if (s.activeSection !== cat) {
          updates.unseenCount = (s.sections[cat].unseenCount || 0) + 1;
        }
      }
      return updateSection(s, cat, updates);
    });
  },
}));
