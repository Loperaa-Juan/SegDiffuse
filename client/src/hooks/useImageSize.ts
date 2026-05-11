import { useEffect, useState } from 'react';

interface ImageSize {
  width: number;
  height: number;
}

export function useImageSize(src: string | null): ImageSize | null {
  const [size, setSize] = useState<ImageSize | null>(null);

  useEffect(() => {
    if (!src) {
      setSize(null);
      return;
    }
    const img = new Image();
    img.onload = () => setSize({ width: img.naturalWidth, height: img.naturalHeight });
    img.src = src;
  }, [src]);

  return size;
}
