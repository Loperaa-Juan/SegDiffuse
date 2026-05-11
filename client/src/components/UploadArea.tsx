import { useCallback, useRef, useState } from 'react';

interface UploadAreaProps {
  onUpload: (file: File) => void;
}

export function UploadArea({ onUpload }: UploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      onUpload(file);
    },
    [onUpload]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={[
        'group relative flex flex-col items-center justify-center gap-4',
        'w-full max-w-xl mx-auto rounded-2xl border-2 border-dashed',
        'cursor-pointer select-none transition-all duration-200',
        'py-16 px-8',
        isDragging
          ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
          : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-500 hover:bg-zinc-900',
      ].join(' ')}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onInputChange}
      />

      {/* Upload icon */}
      <div
        className={[
          'flex items-center justify-center w-16 h-16 rounded-full transition-all duration-200',
          isDragging ? 'bg-indigo-500/20' : 'bg-zinc-800 group-hover:bg-zinc-700',
        ].join(' ')}
      >
        <svg
          className={[
            'w-7 h-7 transition-colors duration-200',
            isDragging ? 'text-indigo-400' : 'text-zinc-400 group-hover:text-zinc-300',
          ].join(' ')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
      </div>

      <div className="text-center space-y-1">
        <p
          className={[
            'text-sm font-medium transition-colors duration-200',
            isDragging ? 'text-indigo-300' : 'text-zinc-300',
          ].join(' ')}
        >
          {isDragging ? 'Drop to upload' : 'Drop an image here'}
        </p>
        <p className="text-xs text-zinc-500">
          or{' '}
          <span className="text-indigo-400 hover:text-indigo-300 transition-colors">
            click to browse
          </span>{' '}
          · PNG, JPG, WEBP
        </p>
      </div>
    </div>
  );
}
