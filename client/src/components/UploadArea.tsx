import { useCallback, useRef, useState } from 'react';

interface UploadAreaProps { onUpload: (file: File) => void; }

const isTouchPrimary = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

export function UploadArea({ onUpload }: UploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const handleFile = useCallback((file: File) => { if (!file.type.startsWith('image/')) return; onUpload(file); }, [onUpload]);
  const onDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files[0]; if (file) handleFile(file); }, [handleFile]);
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) handleFile(file); };
  const handleClick = () => inputRef.current?.click();
  const handleTouchEnd = (e: React.TouchEvent) => { e.preventDefault(); inputRef.current?.click(); };

  return (
    <div
      onClick={handleClick}
      onTouchEnd={handleTouchEnd}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      role="button"
      tabIndex={0}
      aria-label="Upload an image"
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      className={[
        'group relative flex flex-col items-center justify-center gap-4',
        'w-full max-w-xl mx-auto rounded-2xl border-2 border-dashed',
        'cursor-pointer select-none transition-all duration-200',
        'py-10 px-6 md:py-16 md:px-8',
        'min-h-[180px] md:min-h-[220px]',
        isDragging
          ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
          : 'border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/50 hover:border-gray-400 dark:hover:border-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-900 active:border-gray-400 dark:active:border-zinc-500 active:bg-gray-100 dark:active:bg-zinc-900',
      ].join(' ')}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onInputChange} />
      <div className={[
        'flex items-center justify-center w-16 h-16 rounded-full transition-all duration-200',
        isDragging
          ? 'bg-indigo-500/20'
          : 'bg-gray-100 dark:bg-zinc-800 group-hover:bg-gray-200 dark:group-hover:bg-zinc-700 group-active:bg-gray-200 dark:group-active:bg-zinc-700',
      ].join(' ')}>
        <svg
          className={[
            'w-7 h-7 transition-colors duration-200',
            isDragging
              ? 'text-indigo-400'
              : 'text-gray-400 dark:text-zinc-400 group-hover:text-gray-600 dark:group-hover:text-zinc-300',
          ].join(' ')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      </div>
      <div className="text-center space-y-1">
        <p className={[
          'text-sm font-medium transition-colors duration-200',
          isDragging ? 'text-indigo-400' : 'text-gray-700 dark:text-zinc-300',
        ].join(' ')}>
          {isDragging ? 'Drop to upload' : isTouchPrimary ? 'Tap to choose an image' : 'Drop an image here'}
        </p>
        <p className="text-xs text-gray-400 dark:text-zinc-500">
          {isTouchPrimary
            ? <>Tap to open your photo library · PNG, JPG, WEBP</>
            : <><span>or</span> <span className="text-indigo-500 dark:text-indigo-400">click to browse</span> · PNG, JPG, WEBP</>}
        </p>
      </div>
    </div>
  );
}
