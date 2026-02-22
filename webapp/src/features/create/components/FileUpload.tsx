import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/utils/cn';
import { uploadApi } from '@/services/api/upload.api';
import type { Category } from '../store/useCreateStore';

const CATEGORY_ACCEPT: Record<Category, string> = {
  TEXT: '',
  IMAGE: 'image/jpeg,image/png,image/webp,image/gif',
  VIDEO: 'video/mp4,video/quicktime,video/webm,image/jpeg,image/png,image/webp',
  AUDIO: 'audio/mpeg,audio/wav,audio/mp4,audio/x-m4a,audio/webm',
};

const CATEGORY_COLORS: Record<Category, { bg: string; text: string; border: string }> = {
  TEXT: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-400/20' },
  IMAGE: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-400/20' },
  VIDEO: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-400/20' },
  AUDIO: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-400/20' },
};

interface FileUploadProps {
  category: Category;
  onFileUploaded: (fileUrl: string) => void;
  onFileClear: () => void;
  uploadedFileUrl: string | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  category,
  onFileUploaded,
  onFileClear,
  uploadedFileUrl,
}) => {
  const { t } = useTranslation('create');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const colors = CATEGORY_COLORS[category];
  const accept = CATEGORY_ACCEPT[category];

  // Don't show for TEXT category
  if (category === 'TEXT' || !accept) return null;

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);
    setFileName(file.name);

    // Generate local preview for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    try {
      const result = await uploadApi.uploadFile(file, setUploadProgress);
      onFileUploaded(result.fileUrl);
      setIsUploading(false);
    } catch (err: any) {
      setError(err.message || t('uploadFailed', 'Upload failed'));
      setIsUploading(false);
      setPreviewUrl(null);
      setFileName(null);
    }
  }, [onFileUploaded, t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleClear = () => {
    setPreviewUrl(null);
    setFileName(null);
    setError(null);
    setUploadProgress(0);
    onFileClear();
  };

  // Show uploaded file preview
  if (uploadedFileUrl || (isUploading && fileName)) {
    return (
      <div className={cn(
        'mb-3 rounded-xl border p-3',
        colors.border, colors.bg,
      )}>
        <div className="flex items-center" style={{ columnGap: 10 }}>
          {/* Preview */}
          {previewUrl ? (
            <img
              src={previewUrl}
              alt=""
              className="w-12 h-12 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center shrink-0', colors.bg)}>
              <svg className={cn('w-5 h-5', colors.text)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{fileName}</p>
            {isUploading ? (
              <div className="mt-1">
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className={cn('h-full rounded-full', colors.text.replace('text-', 'bg-'))}
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-[10px] text-content-tertiary mt-0.5">{uploadProgress}%</p>
              </div>
            ) : (
              <p className={cn('text-[10px]', colors.text)}>
                {t('fileReady', 'Ready')}
              </p>
            )}
          </div>

          {/* Remove button */}
          {!isUploading && (
            <button
              onClick={handleClear}
              className="shrink-0 p-1.5 rounded-lg text-content-tertiary hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {error && (
          <p className="text-red-400 text-xs mt-2">{error}</p>
        )}
      </div>
    );
  }

  // Drop zone
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="mb-3"
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'w-full rounded-xl border border-dashed p-4 text-center transition-all cursor-pointer',
            isDragging
              ? cn(colors.border, colors.bg)
              : 'border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.02]',
          )}
        >
          <div className="flex flex-col items-center" style={{ rowGap: 6 }}>
            <svg className={cn('w-5 h-5', isDragging ? colors.text : 'text-content-tertiary')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <p className="text-xs text-content-secondary">
              {t('dropFileHere', 'Drop file here or click to upload')}
            </p>
          </div>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />

        {error && (
          <p className="text-red-400 text-xs mt-1">{error}</p>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
