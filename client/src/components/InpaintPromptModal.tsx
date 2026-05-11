import { useEffect, useRef, useState } from 'react';
import type { DetectedObject } from '../types/segmentation';

interface InpaintPromptModalProps {
  object: DetectedObject;
  onCancel: () => void;
  onSubmit: (prompt: string) => void;
}

export function InpaintPromptModal({ object, onCancel, onSubmit }: InpaintPromptModalProps) {
  const [prompt, setPrompt] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  const trimmed = prompt.trim();
  const canSubmit = trimmed.length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (canSubmit) onSubmit(trimmed);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onCancel}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-5 md:p-6 space-y-4 animate-slide-up"
        style={{ boxShadow: `0 0 0 1px ${object.color.raw}33, 0 20px 60px rgba(0,0,0,0.5)` }}
      >
        <div className="flex items-start gap-3">
          <span
            className="flex-shrink-0 mt-1 w-3 h-3 rounded-full"
            style={{ backgroundColor: object.color.raw, boxShadow: `0 0 8px ${object.color.raw}` }}
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-zinc-100">
              Replace this <span className="capitalize">{object.className}</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Describe what should appear in its place.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex-shrink-0 -mt-1 -mr-1 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <textarea
          ref={inputRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. a vase of red tulips on a wooden table"
          rows={3}
          className="w-full resize-none bg-zinc-950 border border-zinc-800 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 outline-none rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 transition-colors"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(e);
          }}
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 min-h-[44px] px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex-1 min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed rounded-lg transition-all duration-150 active:scale-[0.97] shadow-lg shadow-indigo-500/20 disabled:shadow-none"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
            Generate
          </button>
        </div>
      </form>
    </div>
  );
}
