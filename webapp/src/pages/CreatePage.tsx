import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCreateStore } from '@/features/create/store/useCreateStore';
import { useCreateSSE } from '@/features/create/hooks/useCreateSSE';
import { CategorySelector } from '@/features/create/components/CategorySelector';
import { ModelSelector } from '@/features/create/components/ModelSelector';
import { PromptPanel } from '@/features/create/components/PromptPanel';
import { ResultDisplay } from '@/features/create/components/ResultDisplay';
import { HistoryPanel } from '@/features/create/components/HistoryPanel';

export default function CreatePage() {
  const {
    step,
    selectedCategory,
    selectedModel,
    models,
    isLoadingModels,
    conversationId,
    isGenerating,
    resultContent,
    resultFileUrl,
    resultStatus,
    resultError,
    fetchModels,
    selectCategory,
    selectModel,
    generate,
    reset,
    goBack,
    createAnother,
  } = useCreateStore();

  const [historyOpen, setHistoryOpen] = useState(false);
  const [lastPrompt, setLastPrompt] = useState('');

  // Connect SSE for active generation
  useCreateSSE(conversationId);

  // Fetch models on mount
  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const handleGenerate = (prompt: string) => {
    setLastPrompt(prompt);
    generate(prompt);
  };

  const handleRetry = () => {
    if (lastPrompt) {
      generate(lastPrompt);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] relative">
      {/* History toggle */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setHistoryOpen(true)}
          className="flex items-center text-content-secondary hover:text-white transition-colors bg-surface-card/40 rounded-xl px-3 py-2 border border-white/[0.06] hover:border-white/[0.12]"
          style={{ columnGap: 6 }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-medium">History</span>
        </button>
      </div>

      {/* Main content area */}
      <div className="flex items-start justify-center px-4 pt-8 pb-12 sm:pt-16">
        <AnimatePresence mode="wait">
          {/* Step 1: Category selection */}
          {step === 'category' && (
            <motion.div
              key="category"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <CategorySelector onSelect={selectCategory} />
            </motion.div>
          )}

          {/* Step 2: Model selection */}
          {step === 'model' && selectedCategory && (
            <motion.div
              key="model"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <ModelSelector
                category={selectedCategory}
                models={models}
                isLoading={isLoadingModels}
                onSelect={selectModel}
                onBack={goBack}
              />
            </motion.div>
          )}

          {/* Step 3: Prompt input */}
          {step === 'prompt' && selectedCategory && selectedModel && (
            <motion.div
              key="prompt"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <PromptPanel
                category={selectedCategory}
                model={selectedModel}
                isGenerating={false}
                onGenerate={handleGenerate}
                onBack={goBack}
              />
            </motion.div>
          )}

          {/* Step 4: Generating / Result */}
          {(step === 'generating' || step === 'result') && selectedCategory && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <ResultDisplay
                category={selectedCategory}
                isGenerating={isGenerating}
                content={resultContent}
                fileUrl={resultFileUrl}
                status={resultStatus}
                error={resultError}
                onCreateAnother={createAnother}
                onNewCreation={reset}
                onRetry={handleRetry}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History drawer */}
      <HistoryPanel isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}
