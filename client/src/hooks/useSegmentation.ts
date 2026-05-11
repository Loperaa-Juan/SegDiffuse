import { useState } from 'react';
import type { DetectedObject, SegmentationResponse } from '../types/segmentation';
import { getObjectColor } from '../utils/colors';
import { computeCentroid } from '../utils/geometry';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

interface UseSegmentationReturn {
  isLoading: boolean;
  error: string | null;
  segment: (file: File) => Promise<DetectedObject[]>;
}

export function useSegmentation(): UseSegmentationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function segment(file: File): Promise<DetectedObject[]> {
    setIsLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);

      const res = await fetch(`${API_BASE}/segmenter`, {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`Segmentation failed (${res.status}): ${detail}`);
      }

      const data: SegmentationResponse = await res.json();

      return data.polygons.map((polygon, idx) => ({
        id: idx,
        label: data.labels[idx],
        score: data.scores[idx],
        className: data.class_names[idx],
        mask: data.masks[idx],
        polygon,
        color: getObjectColor(idx),
        centroid: computeCentroid(polygon),
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }

  return { isLoading, error, segment };
}
