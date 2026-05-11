import { useCallback, useEffect, useState } from 'react';
import type { AppPhase, DetectedObject, InpaintingResult } from './types/segmentation';
import { useSegmentation } from './hooks/useSegmentation';
import { useInpainting } from './hooks/useInpainting';
import { UploadArea } from './components/UploadArea';
import { SegmentationCanvas } from './components/SegmentationCanvas';
import { ObjectPanel } from './components/ObjectPanel';
import { InpaintPromptModal } from './components/InpaintPromptModal';
import { InpaintingResultView } from './components/InpaintingResultView';

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [objects, setObjects] = useState<DetectedObject[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [inpaintingResult, setInpaintingResult] = useState<InpaintingResult | null>(null);

  const { error, segment } = useSegmentation();
  const { error: inpaintError, inpaint, reset: resetInpaintError } = useInpainting();

  // Clean up object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  // Clean up the inpainted result URL when it changes or unmounts
  useEffect(() => {
    return () => {
      if (inpaintingResult) URL.revokeObjectURL(inpaintingResult.imageUrl);
    };
  }, [inpaintingResult]);

  const handleUpload = useCallback((file: File) => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    const url = URL.createObjectURL(file);
    setImageFile(file);
    setImageUrl(url);
    setObjects([]);
    setSelectedId(null);
    setPhase('preview');
  }, [imageUrl]);

  const handleSegment = useCallback(async () => {
    if (!imageFile) return;
    setPhase('segmenting');
    const detected = await segment(imageFile);
    setObjects(detected);
    setSelectedId(null);
    setPhase(detected.length > 0 ? 'segmented' : 'preview');
  }, [imageFile, segment]);

  const handleSelect = useCallback((id: number) => {
    setSelectedId(id);
    setPhase('selected');
  }, []);

  const handleDeselect = useCallback(() => {
    setSelectedId(null);
    setPhase('segmented');
  }, []);

  const handleReset = useCallback(() => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    if (inpaintingResult) URL.revokeObjectURL(inpaintingResult.imageUrl);
    setImageFile(null);
    setImageUrl(null);
    setObjects([]);
    setSelectedId(null);
    setInpaintingResult(null);
    setPhase('upload');
  }, [imageUrl, inpaintingResult]);

  const handleStartInpaint = useCallback((id: number) => {
    setSelectedId(id);
    resetInpaintError();
    setPhase('prompting');
  }, [resetInpaintError]);

  const handleCancelPrompt = useCallback(() => {
    setPhase(selectedId !== null ? 'selected' : 'segmented');
  }, [selectedId]);

  const handleSubmitPrompt = useCallback(async (prompt: string) => {
    if (!imageFile || selectedId === null) return;
    const target = objects.find((o) => o.id === selectedId);
    if (!target) return;

    setPhase('inpainting');
    const resultUrl = await inpaint({
      imageFile,
      maskBase64: target.mask,
      prompt,
    });

    if (resultUrl) {
      if (inpaintingResult) URL.revokeObjectURL(inpaintingResult.imageUrl);
      setInpaintingResult({ imageUrl: resultUrl, prompt, objectId: target.id });
      setPhase('inpainted');
    } else {
      setPhase('prompting');
    }
  }, [imageFile, selectedId, objects, inpaint, inpaintingResult]);

  const handleTryAgain = useCallback(() => {
    resetInpaintError();
    setPhase('prompting');
  }, [resetInpaintError]);

  const handleBackToSelection = useCallback(() => {
    if (inpaintingResult) URL.revokeObjectURL(inpaintingResult.imageUrl);
    setInpaintingResult(null);
    setPhase(selectedId !== null ? 'selected' : 'segmented');
  }, [inpaintingResult, selectedId]);

  const isSegmentedPhase = phase === 'segmented' || phase === 'selected' || phase === 'prompting';
  const selectedObject = selectedId !== null ? objects.find((o) => o.id === selectedId) ?? null : null;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-zinc-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-zinc-100 tracking-tight">
            Segment & Inpaint
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Phase indicator — hidden on very small screens to avoid overflow */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500">
            <PhaseStep label="Upload" active={phase === 'upload'} done={phase !== 'upload'} />
            <div className="w-4 h-px bg-zinc-700" />
            <PhaseStep label="Analyze" active={phase === 'segmenting'} done={isSegmentedPhase} />
            <div className="w-4 h-px bg-zinc-700" />
            <PhaseStep label="Select" active={phase === 'selected'} done={false} />
          </div>

          {phase !== 'upload' && (
            <button
              onClick={handleReset}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs text-zinc-500 hover:text-zinc-300 active:text-zinc-200 transition-colors px-3 py-2 rounded-md hover:bg-zinc-800 active:bg-zinc-700"
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
          <div className="flex-1 flex flex-col items-center justify-center gap-6 md:gap-8 px-4 md:px-6 py-10 md:py-16 animate-fade-in">
            <div className="text-center space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 tracking-tight">
                AI Image Segmentation
              </h1>
              <p className="text-zinc-400 text-sm max-w-md">
                Upload an image to detect and isolate objects with pixel-precise segmentation.
              </p>
            </div>
            <UploadArea onUpload={handleUpload} />
          </div>
        )}

        {/* Preview phase */}
        {phase === 'preview' && imageUrl && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 md:gap-6 px-4 md:px-6 py-8 md:py-10 animate-fade-in">
            <div className="relative max-w-2xl w-full">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full rounded-xl shadow-2xl object-contain max-h-[55vh] md:max-h-[60vh]"
              />
              <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/5" />
            </div>

            <div className="flex items-center gap-3 w-full max-w-sm md:max-w-none md:w-auto">
              <button
                onClick={() => setPhase('upload')}
                className="flex-1 md:flex-none min-h-[44px] flex items-center justify-center px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 active:text-zinc-200 border border-zinc-700 hover:border-zinc-600 active:border-zinc-600 rounded-lg transition-all duration-150"
              >
                Change image
              </button>
              <button
                onClick={handleSegment}
                className="flex-1 md:flex-none min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-500 rounded-lg transition-all duration-150 active:scale-[0.97] shadow-lg shadow-indigo-500/20"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
                Analyze image
              </button>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 px-4 py-2 rounded-lg max-w-sm md:max-w-none text-center md:text-left">
                {error}
              </p>
            )}
          </div>
        )}

        {/* Segmenting phase */}
        {phase === 'segmenting' && imageUrl && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-10 animate-fade-in">
            <div className="relative max-w-2xl w-full opacity-60">
              <img
                src={imageUrl}
                alt="Analyzing"
                className="w-full rounded-xl shadow-2xl object-contain max-h-[60vh]"
              />
              <div className="absolute inset-0 rounded-xl bg-zinc-950/40 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-zinc-700 border-t-indigo-400 rounded-full animate-spin" />
                  <p className="text-sm text-zinc-400">Segmenting objects…</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Segmented / Selected phase */}
        {isSegmentedPhase && imageUrl && (
          <div className="flex-1 flex flex-col md:flex-row gap-0 animate-fade-in md:overflow-hidden">
            {/* Canvas area */}
            <div className="flex-1 flex items-start justify-center p-3 md:p-6 min-w-0">
              <div className="w-full max-w-4xl">
                <SegmentationCanvas
                  imageUrl={imageUrl}
                  objects={objects}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                  onDeselect={handleDeselect}
                />
                <p className="mt-2 md:mt-2.5 text-xs text-zinc-600 text-center">
                  {selectedId !== null
                    ? 'Tap the canvas or Clear to deselect'
                    : 'Tap a polygon to select an object'}
                </p>
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={handleReset}
                    className="min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-200 active:text-zinc-200 border border-zinc-700 hover:border-zinc-600 active:border-zinc-600 rounded-lg transition-all duration-150"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 7.5m0 0L7.5 12M12 7.5v9" />
                    </svg>
                    Use another photo
                  </button>
                </div>
              </div>
            </div>

            {/* Object panel — stacks below canvas on mobile, fixed sidebar on md+ */}
            <div className="md:w-72 md:flex-shrink-0 border-t md:border-t-0 md:border-l border-zinc-800/60 p-4 md:p-5 md:overflow-y-auto">
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

        {/* Inpainting in progress */}
        {phase === 'inpainting' && imageUrl && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-10 animate-fade-in">
            <div className="relative max-w-2xl w-full opacity-60">
              <img
                src={imageUrl}
                alt="Inpainting"
                className="w-full rounded-xl shadow-2xl object-contain max-h-[60vh]"
              />
              <div className="absolute inset-0 rounded-xl bg-zinc-950/40 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-zinc-700 border-t-indigo-400 rounded-full animate-spin" />
                  <p className="text-sm text-zinc-400">Generating inpainting…</p>
                  <p className="text-xs text-zinc-600">This may take ~30s</p>
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

      {/* Prompt modal */}
      {phase === 'prompting' && selectedObject && (
        <InpaintPromptModal
          object={selectedObject}
          onCancel={handleCancelPrompt}
          onSubmit={handleSubmitPrompt}
        />
      )}

      {/* Inpaint error toast */}
      {inpaintError && (phase === 'prompting' || phase === 'selected') && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] max-w-md w-[calc(100%-2rem)] animate-slide-up">
          <div className="text-sm text-red-300 bg-red-950/90 border border-red-500/40 px-4 py-3 rounded-lg shadow-2xl backdrop-blur-sm">
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
        active ? 'text-indigo-400 font-medium' : done ? 'text-zinc-400' : 'text-zinc-600',
      ].join(' ')}
    >
      {label}
    </span>
  );
}
