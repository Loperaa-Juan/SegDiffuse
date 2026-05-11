import { useState } from 'react';

const API_BASE =
  import.meta.env.VITE_INPAINTING_API_BASE_URL ??
  'https://zdru771une13bi-8000.proxy.runpod.net';

interface UseInpaintingReturn {
  isLoading: boolean;
  error: string | null;
  inpaint: (args: {
    imageFile: File;
    maskBase64: string;
    prompt: string;
  }) => Promise<string | null>;
  reset: () => void;
}

function base64ToBlob(base64: string, mime = 'image/png'): Blob {
  const cleaned = base64.includes(',') ? base64.split(',')[1] : base64;
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export function useInpainting(): UseInpaintingReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function inpaint({
    imageFile,
    maskBase64,
    prompt,
  }: {
    imageFile: File;
    maskBase64: string;
    prompt: string;
  }): Promise<string | null> {
    setIsLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', imageFile);
      form.append('mask', base64ToBlob(maskBase64, 'image/png'), 'mask.png');
      form.append('prompt', prompt);

      const res = await fetch(`${API_BASE}/inpainting`, {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`Inpainting failed (${res.status}): ${detail}`);
      }

      const blob = await res.blob();
      return URL.createObjectURL(blob);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  function reset() {
    setError(null);
  }

  return { isLoading, error, inpaint, reset };
}
