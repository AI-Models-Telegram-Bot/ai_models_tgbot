import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/ui';
import type { Category } from '../store/useCreateStore';

const CATEGORY_COLORS: Record<Category, { text: string; dot: string }> = {
  TEXT: { text: 'text-cyan-400', dot: 'bg-cyan-400' },
  IMAGE: { text: 'text-purple-400', dot: 'bg-purple-400' },
  VIDEO: { text: 'text-orange-400', dot: 'bg-orange-400' },
  AUDIO: { text: 'text-emerald-400', dot: 'bg-emerald-400' },
};

const CATEGORY_BG: Record<Category, string> = {
  TEXT: 'from-cyan-500/8',
  IMAGE: 'from-purple-500/8',
  VIDEO: 'from-orange-500/8',
  AUDIO: 'from-emerald-500/8',
};

interface ResultDisplayProps {
  category: Category;
  isGenerating: boolean;
  content: string | null;
  fileUrl: string | null;
  status: 'PENDING' | 'STREAMING' | 'COMPLETED' | 'FAILED' | null;
  error: string | null;
  onCreateAnother: () => void;
  onNewCreation: () => void;
  onRetry: () => void;
}

/** Simple inline markdown renderer for text results */
function renderTextContent(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let key = 0;

  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const segments: { type: 'text' | 'codeblock'; content: string; lang?: string }[] = [];

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'codeblock', content: match[2], lang: match[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  for (const seg of segments) {
    if (seg.type === 'codeblock') {
      parts.push(
        <pre key={key++} className="my-2 overflow-x-auto rounded-lg bg-surface-bg/80 p-3 text-xs text-content-secondary">
          <code>{seg.content}</code>
        </pre>,
      );
    } else {
      const inlineRegex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
      let inlineLast = 0;
      let inlineMatch: RegExpExecArray | null;
      const inlineParts: React.ReactNode[] = [];

      while ((inlineMatch = inlineRegex.exec(seg.content)) !== null) {
        if (inlineMatch.index > inlineLast) {
          inlineParts.push(seg.content.slice(inlineLast, inlineMatch.index));
        }
        if (inlineMatch[2]) {
          inlineParts.push(<strong key={key++} className="font-semibold text-white">{inlineMatch[2]}</strong>);
        } else if (inlineMatch[3]) {
          inlineParts.push(<em key={key++}>{inlineMatch[3]}</em>);
        } else if (inlineMatch[4]) {
          inlineParts.push(
            <code key={key++} className="rounded bg-surface-bg/60 px-1 py-0.5 text-xs text-brand-primary">
              {inlineMatch[4]}
            </code>,
          );
        }
        inlineLast = inlineMatch.index + inlineMatch[0].length;
      }
      if (inlineLast < seg.content.length) {
        inlineParts.push(seg.content.slice(inlineLast));
      }
      parts.push(<span key={key++}>{inlineParts}</span>);
    }
  }

  return <>{parts}</>;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({
  category,
  isGenerating,
  content,
  fileUrl,
  status,
  error,
  onCreateAnother,
  onNewCreation,
  onRetry,
}) => {
  const colors = CATEGORY_COLORS[category];
  const bgGrad = CATEGORY_BG[category];

  /* ---- Generating state ---- */
  if (isGenerating && !content && !fileUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl mx-auto"
      >
        <div className={cn(
          'rounded-2xl bg-surface-card border border-white/[0.08] p-10',
          'relative overflow-hidden',
        )}>
          <div className={`absolute inset-0 bg-gradient-to-br ${bgGrad} to-transparent pointer-events-none`} />
          <div className="relative z-10 flex flex-col items-center" style={{ rowGap: 20 }}>
            {/* Animated dots */}
            <div className="flex items-center" style={{ columnGap: 8 }}>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className={cn('w-3 h-3 rounded-full', colors.dot)}
                  animate={{
                    y: [0, -12, 0],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
            <div className="text-center">
              <p className="text-white font-medium">Generating...</p>
              <p className="text-content-secondary text-xs mt-1">
                {category === 'TEXT' ? 'Writing response' : category === 'IMAGE' ? 'Creating image' : category === 'VIDEO' ? 'Rendering video — this may take a moment' : 'Generating audio'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ---- Streaming text ---- */
  if (category === 'TEXT' && content && status !== 'COMPLETED' && status !== 'FAILED') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-2xl mx-auto"
      >
        <div className="rounded-2xl bg-surface-card border border-white/[0.08] p-5">
          <div className="whitespace-pre-wrap break-words text-sm text-content-secondary leading-relaxed">
            {renderTextContent(content)}
            <span className="inline-block w-2 h-4 bg-brand-primary/60 animate-pulse ml-0.5" />
          </div>
        </div>
      </motion.div>
    );
  }

  /* ---- Failed ---- */
  if (status === 'FAILED') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-auto"
      >
        <div className="rounded-2xl bg-surface-card border border-red-500/20 p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-400 text-sm font-medium mb-1">Generation Failed</p>
          <p className="text-content-secondary text-xs mb-5">{error || 'Something went wrong'}</p>
          <div className="flex items-center justify-center" style={{ columnGap: 12 }}>
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Try Again
            </Button>
            <Button variant="ghost" size="sm" onClick={onNewCreation}>
              New Creation
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ---- Completed result ---- */
  if (status === 'COMPLETED') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl mx-auto"
      >
        <div className="rounded-2xl bg-surface-card border border-white/[0.08] overflow-hidden">
          {/* Text result */}
          {category === 'TEXT' && content && (
            <div className="p-5">
              <div className="whitespace-pre-wrap break-words text-sm text-content-secondary leading-relaxed">
                {renderTextContent(content)}
              </div>
            </div>
          )}

          {/* Image result */}
          {category === 'IMAGE' && fileUrl && (
            <div className="p-4">
              <img
                src={fileUrl}
                alt="Generated image"
                className="w-full rounded-xl"
                loading="lazy"
              />
            </div>
          )}

          {/* Video result */}
          {category === 'VIDEO' && fileUrl && (
            <div className="p-4">
              <video
                src={fileUrl}
                controls
                className="w-full rounded-xl"
                preload="metadata"
                autoPlay
                muted
              />
            </div>
          )}

          {/* Audio result */}
          {category === 'AUDIO' && fileUrl && (
            <div className="p-5">
              <div className="flex items-center justify-center py-6">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                  </svg>
                </div>
              </div>
              <audio src={fileUrl} controls className="w-full" preload="metadata" />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between p-4 border-t border-white/[0.06]">
            <div className="flex items-center" style={{ columnGap: 8 }}>
              {fileUrl && (
                <a
                  href={fileUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-xs text-content-secondary hover:text-white transition-colors"
                  style={{ columnGap: 4 }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
              )}
            </div>
            <div className="flex items-center" style={{ columnGap: 8 }}>
              <Button variant="ghost" size="sm" onClick={onNewCreation}>
                New
              </Button>
              <Button variant="primary" size="sm" onClick={onCreateAnother}>
                Create Another
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
};
