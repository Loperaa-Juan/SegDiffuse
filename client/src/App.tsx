import { useCallback, useEffect, useState } from 'react';
import type { AppPhase, DetectedObject, InpaintingResult } from './types/segmentation';
import { useSegmentation } from './hooks/useSegmentation';
import { useInpainting } from './hooks/useInpainting';
import { UploadArea } from './components/UploadArea';
import { SegmentationCanvas } from './components/SegmentationCanvas';
import { ObjectPanel } from './components/ObjectPanel';
import { InpaintPromptModal } from './components/InpaintPromptModal';
import { InpaintingResultView } from './components/InpaintingResultView';

const GITHUB_URL = 'https://github.com/Loperaa-Juan/SegDiffuse';
const DETECTRON2_URL = 'https://github.com/facebookresearch/detectron2';
const FLUX_URL = 'https://huggingface.co/black-forest-labs/FLUX.1-Fill-dev';

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [objects, setObjects] = useState<DetectedObject[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [inpaintingResult, setInpaintingResult] = useState<InpaintingResult | null>(null);

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const { error, segment } = useSegmentation();
  const { error: inpaintError, inpaint, reset: resetInpaintError } = useInpainting();

  useEffect(() => { return () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }; }, [imageUrl]);
  useEffect(() => { return () => { if (inpaintingResult) URL.revokeObjectURL(inpaintingResult.imageUrl); }; }, [inpaintingResult]);

  const handleUpload = useCallback((file: File) => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    const url = URL.createObjectURL(file);
    setImageFile(file); setImageUrl(url); setObjects([]); setSelectedId(null); setPhase('preview');
  }, [imageUrl]);

  const handleSegment = useCallback(async () => {
    if (!imageFile) return;
    setPhase('segmenting');
    const detected = await segment(imageFile);
    setObjects(detected); setSelectedId(null);
    setPhase(detected.length > 0 ? 'segmented' : 'preview');
  }, [imageFile, segment]);

  const handleSelect = useCallback((id: number) => { setSelectedId(id); setPhase('selected'); }, []);
  const handleDeselect = useCallback(() => { setSelectedId(null); setPhase('segmented'); }, []);

  const handleReset = useCallback(() => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    if (inpaintingResult) URL.revokeObjectURL(inpaintingResult.imageUrl);
    setImageFile(null); setImageUrl(null); setObjects([]); setSelectedId(null); setInpaintingResult(null); setPhase('upload');
  }, [imageUrl, inpaintingResult]);

  const handleStartInpaint = useCallback((id: number) => { setSelectedId(id); resetInpaintError(); setPhase('prompting'); }, [resetInpaintError]);
  const handleCancelPrompt = useCallback(() => { setPhase(selectedId !== null ? 'selected' : 'segmented'); }, [selectedId]);

  const handleSubmitPrompt = useCallback(async (prompt: string) => {
    if (!imageFile || selectedId === null) return;
    const target = objects.find((o) => o.id === selectedId);
    if (!target) return;
    setPhase('inpainting');
    const resultUrl = await inpaint({ imageFile, maskBase64: target.mask, prompt });
    if (resultUrl) {
      if (inpaintingResult) URL.revokeObjectURL(inpaintingResult.imageUrl);
      setInpaintingResult({ imageUrl: resultUrl, prompt, objectId: target.id });
      setPhase('inpainted');
    } else { setPhase('prompting'); }
  }, [imageFile, selectedId, objects, inpaint, inpaintingResult]);

  const handleTryAgain = useCallback(() => { resetInpaintError(); setPhase('prompting'); }, [resetInpaintError]);
  const handleBackToSelection = useCallback(() => {
    if (inpaintingResult) URL.revokeObjectURL(inpaintingResult.imageUrl);
    setInpaintingResult(null);
    setPhase(selectedId !== null ? 'selected' : 'segmented');
  }, [inpaintingResult, selectedId]);

  const isSegmentedPhase = phase === 'segmented' || phase === 'selected' || phase === 'prompting';
  const selectedObject = selectedId !== null ? objects.find((o) => o.id === selectedId) ?? null : null;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col transition-colors duration-200">

      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-gray-200/80 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100 tracking-tight">SegDiffuse</span>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Phase indicator — hidden on smallest screens */}
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <PhaseStep label="Upload" active={phase === 'upload'} done={phase !== 'upload'} />
            <div className="w-4 h-px bg-gray-200 dark:bg-zinc-700" />
            <PhaseStep label="Analyze" active={phase === 'segmenting'} done={isSegmentedPhase || phase === 'inpainting' || phase === 'inpainted'} />
            <div className="w-4 h-px bg-gray-200 dark:bg-zinc-700" />
            <PhaseStep label="Select" active={phase === 'selected'} done={phase === 'prompting' || phase === 'inpainting' || phase === 'inpainted'} />
            <div className="w-4 h-px bg-gray-200 dark:bg-zinc-700" />
            <PhaseStep label="Inpaint" active={phase === 'inpainting' || phase === 'prompting'} done={phase === 'inpainted'} />
          </div>

          {/* GitHub link */}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View on GitHub"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md text-gray-500 dark:text-zinc-500 hover:text-gray-800 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 active:bg-gray-200 dark:active:bg-zinc-700 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>

          {/* Theme toggle */}
          <button
            onClick={() => setIsDark((d) => !d)}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md text-gray-500 dark:text-zinc-500 hover:text-gray-800 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 active:bg-gray-200 dark:active:bg-zinc-700 transition-colors"
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
          </button>

          {/* Start over */}
          {phase !== 'upload' && (
            <button
              onClick={handleReset}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs text-gray-500 dark:text-zinc-500 hover:text-gray-800 dark:hover:text-zinc-300 active:text-gray-900 dark:active:text-zinc-200 transition-colors px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 active:bg-gray-200 dark:active:bg-zinc-700"
            >
              Start over
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col">

        {/* Upload phase */}
        {phase === 'upload' && (
          <div className="upload-hero-bg flex-1 flex flex-col items-center justify-center gap-6 md:gap-8 px-4 md:px-6 py-10 md:py-16 animate-fade-in">
            <div className="text-center space-y-4">
              {/* Title */}
              <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
                AI Image Segmentation{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
                  &amp; Inpainting
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-gray-500 dark:text-zinc-400 text-sm max-w-sm mx-auto">
                Select any object in your image and replace it with AI-generated content using a text prompt.
              </p>

              {/* Tech links */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <a
                  href={DETECTRON2_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-700 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  Detectron2
                </a>
                <span className="text-gray-300 dark:text-zinc-600 text-xs">+</span>
                <a
                  href={FLUX_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-700 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M3.5 16.5h17M3.5 12h17M3.5 7.5h17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
                  </svg>
                  FLUX.1-Fill-dev
                </a>
              </div>
            </div>

            <UploadArea onUpload={handleUpload} />
          </div>
        )}

        {/* Preview phase */}
        {phase === 'preview' && imageUrl && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 md:gap-6 px-4 md:px-6 py-8 md:py-10 animate-fade-in">
            <div className="relative max-w-2xl w-full">
              <img src={imageUrl} alt="Preview" className="w-full rounded-xl shadow-2xl object-contain max-h-[55vh] md:max-h-[60vh]" />
              <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/5 dark:ring-white/5" />
            </div>
            <div className="flex items-center gap-3 w-full max-w-sm md:max-w-none md:w-auto">
              <button
                onClick={() => setPhase('upload')}
                className="flex-1 md:flex-none min-h-[44px] flex items-center justify-center px-4 py-2.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200 border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 rounded-lg transition-all duration-150"
              >
                Change image
              </button>
              <button
                onClick={handleSegment}
                className="flex-1 md:flex-none min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all duration-150 active:scale-[0.97] shadow-lg shadow-indigo-500/20"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
                Analyze image
              </button>
            </div>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-400/10 border border-red-200 dark:border-red-400/20 px-4 py-2 rounded-lg max-w-sm md:max-w-none text-center md:text-left">
                {error}
              </p>
            )}
          </div>
        )}

        {/* Segmenting phase */}
        {phase === 'segmenting' && imageUrl && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-10 animate-fade-in">
            <div className="relative max-w-2xl w-full opacity-60">
              <img src={imageUrl} alt="Analyzing" className="w-full rounded-xl shadow-2xl object-contain max-h-[60vh]" />
              <div className="absolute inset-0 rounded-xl bg-white/60 dark:bg-zinc-950/40 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm rounded-2xl px-6 py-4 border border-gray-100 dark:border-zinc-800 shadow-lg">
                  <div className="w-8 h-8 border-2 border-gray-200 dark:border-zinc-700 border-t-indigo-500 rounded-full animate-spin" />
                  <p className="text-sm text-gray-700 dark:text-zinc-300">Segmenting objects…</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Segmented / Selected / Prompting phases */}
        {isSegmentedPhase && imageUrl && (
          <div className="flex-1 flex flex-col md:flex-row gap-0 animate-fade-in md:overflow-hidden">
            <div className="flex-1 flex items-start justify-center p-3 md:p-6 min-w-0 bg-gray-50/50 dark:bg-transparent">
              <div className="w-full max-w-4xl">
                <SegmentationCanvas
                  imageUrl={imageUrl}
                  objects={objects}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                  onDeselect={handleDeselect}
                />
                <p className="mt-2 md:mt-2.5 text-xs text-gray-400 dark:text-zinc-600 text-center">
                  {selectedId !== null ? 'Tap the canvas or Clear to deselect' : 'Tap a polygon to select an object'}
                </p>
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={handleReset}
                    className="min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200 border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 rounded-lg transition-all duration-150"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 7.5m0 0L7.5 12M12 7.5v9" />
                    </svg>
                    Use another photo
                  </button>
                </div>
              </div>
            </div>
            <div className="md:w-72 md:flex-shrink-0 border-t md:border-t-0 md:border-l border-gray-200 dark:border-zinc-800/60 bg-white dark:bg-transparent p-4 md:p-5 md:overflow-y-auto">
              <ObjectPanel
                objects={objects}
                selectedId={selectedId}
                onSelect={handleSelect}
                onDeselect={handleDeselect}
                onInpaint={handleStartInpaint}
              />
            </div>
          </div>
        )}

        {/* Inpainting phase */}
        {phase === 'inpainting' && imageUrl && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-10 animate-fade-in">
            <div className="relative max-w-2xl w-full opacity-60">
              <img src={imageUrl} alt="Inpainting" className="w-full rounded-xl shadow-2xl object-contain max-h-[60vh]" />
              <div className="absolute inset-0 rounded-xl bg-white/60 dark:bg-zinc-950/40 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm rounded-2xl px-6 py-4 border border-gray-100 dark:border-zinc-800 shadow-lg">
                  <div className="w-8 h-8 border-2 border-gray-200 dark:border-zinc-700 border-t-indigo-500 rounded-full animate-spin" />
                  <p className="text-sm text-gray-700 dark:text-zinc-300">Generating inpainting…</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">This may take ~30s</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inpainted result */}
        {phase === 'inpainted' && imageUrl && inpaintingResult && (
          <InpaintingResultView
            originalUrl={imageUrl}
            result={inpaintingResult}
            onTryAgain={handleTryAgain}
            onBackToSelection={handleBackToSelection}
          />
        )}
      </main>

      {/* Inpaint prompt modal */}
      {phase === 'prompting' && selectedObject && (
        <InpaintPromptModal
          object={selectedObject}
          onCancel={handleCancelPrompt}
          onSubmit={handleSubmitPrompt}
        />
      )}

      {/* Error toast */}
      {inpaintError && (phase === 'prompting' || phase === 'selected') && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] max-w-md w-[calc(100%-2rem)] animate-slide-up">
          <div className="text-sm text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-950/90 border border-red-200 dark:border-red-500/40 px-4 py-3 rounded-lg shadow-2xl backdrop-blur-sm">
            {inpaintError}
          </div>
        </div>
      )}
    </div>
  );
}

function PhaseStep({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <span
      className={[
        'transition-colors duration-200',
        active
          ? 'text-indigo-500 dark:text-indigo-400 font-medium'
          : done
          ? 'text-gray-500 dark:text-zinc-400'
          : 'text-gray-300 dark:text-zinc-600',
      ].join(' ')}
    >
      {label}
    </span>
  );
}
