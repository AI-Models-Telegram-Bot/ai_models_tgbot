import { useState, useRef } from 'react';
import { Play, Volume2, ExternalLink } from 'lucide-react';

interface MediaPreviewProps {
  url?: string | null;
  category?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/** Inline thumbnail for table rows — shows image/video icon with hover popup */
export function MediaThumbnail({ url, category, className = '' }: MediaPreviewProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [popupPos, setPopupPos] = useState<'above' | 'below'>('above');
  const ref = useRef<HTMLDivElement>(null);

  if (!url) return null;

  const isImage = category === 'IMAGE';
  const isVideo = category === 'VIDEO';
  const isAudio = category === 'AUDIO';

  const handleMouseEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPopupPos(rect.top > 300 ? 'above' : 'below');
    }
    setShowPopup(true);
  };

  return (
    <div
      ref={ref}
      className={`relative inline-flex ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShowPopup(false)}
    >
      {isImage && (
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-800 border border-gray-700 flex-shrink-0">
          <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
      )}
      {isVideo && (
        <div className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0">
          <Play size={16} className="text-blue-400" />
        </div>
      )}
      {isAudio && (
        <div className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0">
          <Volume2 size={16} className="text-purple-400" />
        </div>
      )}

      {/* Hover popup */}
      {showPopup && (isImage || isVideo) && (
        <div
          className={`absolute z-50 left-12 ${popupPos === 'above' ? 'bottom-0' : 'top-0'}`}
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden p-1">
            {isImage && (
              <img src={url} alt="" className="max-w-[300px] max-h-[250px] rounded-lg object-contain" />
            )}
            {isVideo && (
              <video src={url} className="max-w-[300px] max-h-[250px] rounded-lg" autoPlay muted loop playsInline />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Full media display for detail drawer */
export function MediaDisplay({ url, category, size = 'lg' }: MediaPreviewProps) {
  const [error, setError] = useState(false);

  if (!url || error) return null;

  const maxH = size === 'lg' ? 'max-h-80' : size === 'md' ? 'max-h-60' : 'max-h-40';
  const isImage = category === 'IMAGE';
  const isVideo = category === 'VIDEO';
  const isAudio = category === 'AUDIO';

  if (isImage) {
    return (
      <div className="mt-2">
        <img
          src={url}
          alt="output"
          className={`rounded-lg ${maxH} w-full object-contain bg-black/20`}
          onError={() => setError(true)}
        />
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 text-xs mt-1.5 hover:underline">
          <ExternalLink size={11} /> Open full size
        </a>
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="mt-2">
        <video
          src={url}
          controls
          playsInline
          className={`rounded-lg ${maxH} w-full bg-black/20`}
        />
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 text-xs mt-1.5 hover:underline">
          <ExternalLink size={11} /> Open in new tab
        </a>
      </div>
    );
  }

  if (isAudio) {
    return (
      <div className="mt-2">
        <audio src={url} controls className="w-full" />
      </div>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 text-sm mt-2 hover:underline break-all">
      <ExternalLink size={12} /> {url}
    </a>
  );
}

/** Formatted error display */
export function ErrorDisplay({ error }: { error?: string | null }) {
  if (!error) return null;

  // Try to parse as JSON for structured errors
  let parsed: any = null;
  try {
    parsed = JSON.parse(error);
  } catch {}

  if (parsed && typeof parsed === 'object') {
    return (
      <div className="space-y-1.5">
        {parsed.message && <div className="text-red-300 text-sm font-medium">{parsed.message}</div>}
        {parsed.code && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-red-400/60">Code:</span>
            <span className="text-red-300 font-mono bg-red-900/20 px-1.5 py-0.5 rounded">{parsed.code}</span>
          </div>
        )}
        {parsed.status && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-red-400/60">Status:</span>
            <span className="text-red-300">{parsed.status}</span>
          </div>
        )}
        {parsed.details && (
          <pre className="text-red-300/80 text-xs bg-red-900/10 rounded-lg p-2 mt-1 overflow-x-auto max-h-32 overflow-y-auto">
            {typeof parsed.details === 'string' ? parsed.details : JSON.stringify(parsed.details, null, 2)}
          </pre>
        )}
        {/* Show any other keys */}
        {Object.keys(parsed).filter(k => !['message', 'code', 'status', 'details'].includes(k)).length > 0 && (
          <pre className="text-red-300/60 text-xs bg-red-900/10 rounded-lg p-2 mt-1 overflow-x-auto max-h-24 overflow-y-auto">
            {JSON.stringify(
              Object.fromEntries(Object.entries(parsed).filter(([k]) => !['message', 'code', 'status', 'details'].includes(k))),
              null, 2
            )}
          </pre>
        )}
      </div>
    );
  }

  // Plain text error — try to find key parts
  const lines = error.split('\n').filter(Boolean);

  return (
    <div className="text-red-300 text-sm whitespace-pre-wrap break-words max-h-48 overflow-y-auto font-mono leading-relaxed">
      {lines.map((line, i) => {
        const isStackTrace = line.trim().startsWith('at ');
        return (
          <div key={i} className={isStackTrace ? 'text-red-400/50 text-xs pl-2' : ''}>
            {line}
          </div>
        );
      })}
    </div>
  );
}
