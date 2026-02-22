import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSectionsStore, type Category } from '../store/useSectionsStore';
import { useSectionSSE } from '../hooks/useSectionSSE';
import { ModelSelector } from './ModelSelector';
import { PromptPanel } from './PromptPanel';
import { ResultDisplay } from './ResultDisplay';

interface SectionViewProps {
  category: Category;
  isVisible: boolean;
}

export const SectionView: React.FC<SectionViewProps> = ({ category, isVisible }) => {
  const section = useSectionsStore((s) => s.sections[category]);
  const models = useSectionsStore((s) => s.models);
  const isLoadingModels = useSectionsStore((s) => s.isLoadingModels);
  const selectModel = useSectionsStore((s) => s.selectModel);
  const switchModel = useSectionsStore((s) => s.switchModel);
  const generate = useSectionsStore((s) => s.generate);
  const resetSection = useSectionsStore((s) => s.resetSection);
  const createAnother = useSectionsStore((s) => s.createAnother);
  const goBack = useSectionsStore((s) => s.goBack);

  const [lastPrompt, setLastPrompt] = useState('');

  // SSE connection for this section
  useSectionSSE(category, section.conversationId, section.resultMessageId);

  const handleGenerate = (prompt: string, fileUrl?: string) => {
    setLastPrompt(prompt);
    generate(category, prompt, fileUrl);
  };

  const handleRetry = () => {
    if (lastPrompt) {
      generate(category, lastPrompt);
    }
  };

  return (
    <div
      className="w-full"
      style={{ display: isVisible ? 'block' : 'none' }}
    >
      <AnimatePresence mode="wait">
        {/* Step 1: Model selection (no category step — category is implicit from tab) */}
        {section.step === 'model' && (
          <motion.div
            key={`${category}-model`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <ModelSelector
              category={category}
              models={models}
              isLoading={isLoadingModels}
              onSelect={(model) => selectModel(category, model)}
            />
          </motion.div>
        )}

        {/* Step 2: Prompt */}
        {section.step === 'prompt' && section.selectedModel && (
          <motion.div
            key={`${category}-prompt`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <PromptPanel
              category={category}
              model={section.selectedModel}
              isGenerating={false}
              onGenerate={handleGenerate}
              onBack={() => goBack(category)}
              models={models}
              onSwitchModel={(model) => switchModel(category, model)}
            />
          </motion.div>
        )}

        {/* Step 3-4: Generating / Result */}
        {(section.step === 'generating' || section.step === 'result') && (
          <motion.div
            key={`${category}-result`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <ResultDisplay
              category={category}
              isGenerating={section.isGenerating}
              content={section.resultContent}
              fileUrl={section.resultFileUrl}
              status={section.resultStatus}
              error={section.resultError}
              onCreateAnother={() => createAnother(category)}
              onNewCreation={() => resetSection(category)}
              onRetry={handleRetry}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
