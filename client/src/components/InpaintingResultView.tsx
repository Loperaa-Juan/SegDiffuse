import type { InpaintingResult } from '../types/segmentation';

interface InpaintingResultViewProps {
  originalUrl: string;
  result: InpaintingResult;
  onTryAgain: () => void;
  onBackToSelection: () => void;
}

export function InpaintingResultView({
  originalUrl,
  result,
  onTryAgain,
  onBackToSelection,
}: InpaintingResultViewProps) {
  return (
    <div className="flex-1 flex flex-col items-center gap-5 md:gap-6 px-4 md:px-6 py-6 md:py-10 animate-fade-in">
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
          Inpainting result
        </p>
        <p className="text-sm text-gray-700 dark:text-zinc-300 max-w-lg">
          <span className="text-gray-400 dark:text-zinc-500">Prompt:</span>{' '}
          <span className="italic">"{result.prompt}"</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5 w-full max-w-5xl">
        <ImageCard label="Original" src={originalUrl} />
        <ImageCard label="Generated" src={result.imageUrl} highlight />
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md sm:max-w-none sm:w-auto">
        <button
          onClick={onBackToSelection}
          className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to objects
        </button>
        <button
          onClick={onTryAgain}
          className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all duration-150 active:scale-[0.97] shadow-lg shadow-indigo-500/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Try another prompt
        </button>
        <a
          href={result.imageUrl}
          download={`inpainted-${result.objectId}.png`}
          className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-gray-600 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download
        </a>
      </div>
    </div>
  );
}

function ImageCard({ label, src, highlight }: { label: string; src: string; highlight?: boolean }) {
  return (
    <div className="space-y-2">
      <p className={[
        'text-xs uppercase tracking-widest',
        highlight ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 dark:text-zinc-500',
      ].join(' ')}>
        {label}
      </p>
      <div
        className={[
          'relative rounded-xl overflow-hidden bg-gray-50 dark:bg-zinc-900 shadow-2xl',
          highlight ? 'ring-1 ring-indigo-500/40' : 'ring-1 ring-gray-200/80 dark:ring-zinc-800/60',
        ].join(' ')}
      >
        <img src={src} alt={label} className="w-full h-auto object-contain max-h-[60vh]" />
      </div>
    </div>
  );
}
