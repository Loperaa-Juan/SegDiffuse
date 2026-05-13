import { useState } from 'react';
import type { DetectedObject } from '../types/segmentation';
import { useImageSize } from '../hooks/useImageSize';
import { PolygonOverlay } from './PolygonOverlay';
import { polygonToSvgPoints } from '../utils/geometry';

interface SegmentationCanvasProps {
  imageUrl: string;
  objects: DetectedObject[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onDeselect: () => void;
}

export function SegmentationCanvas({
  imageUrl,
  objects,
  selectedId,
  onSelect,
  onDeselect,
}: SegmentationCanvasProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const size = useImageSize(imageUrl);

  if (!size) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-zinc-900 rounded-xl">
        <div className="w-6 h-6 border-2 border-gray-300 dark:border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const { width: imgW, height: imgH } = size;
  const selectedObj = selectedId !== null ? objects.find((o) => o.id === selectedId) : null;
  const hoveredObj =
    selectedId === null && hoveredId !== null
      ? objects.find((o) => o.id === hoveredId)
      : null;

  return (
    <div
      className="relative rounded-xl overflow-hidden bg-zinc-900 shadow-2xl mx-auto"
      style={{
        aspectRatio: `${imgW}/${imgH}`,
        width: 'auto',
        maxWidth: '100%',
        // On mobile keep the canvas shorter so the object panel below is reachable
        // without excessive scrolling; desktop gets the full 70vh.
        maxHeight: 'min(70vh, 100vw)',
      }}
    >
      {/* Main SVG layer */}
      <svg
        viewBox={`0 0 ${imgW} ${imgH}`}
        className="absolute inset-0 w-full h-full"
        style={{ display: 'block' }}
      >
        {/* Base image */}
        <image
          href={imageUrl}
          x={0}
          y={0}
          width={imgW}
          height={imgH}
          preserveAspectRatio="xMidYMid slice"
        />

        {/* Dark vignette overlay for selection — cuts out selected polygon */}
        {selectedObj && (
          <>
            <defs>
              <mask id="selection-cutout">
                <rect width={imgW} height={imgH} fill="white" />
                <polygon
                  points={polygonToSvgPoints(selectedObj.polygon)}
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width={imgW}
              height={imgH}
              fill="rgba(0,0,0,0.68)"
              mask="url(#selection-cutout)"
              style={{ transition: 'opacity 0.3s ease' }}
            />
          </>
        )}

        {/* Polygon overlays */}
        {objects.map((obj) => (
          <PolygonOverlay
            key={obj.id}
            object={obj}
            isHovered={hoveredId === obj.id}
            isSelected={selectedId === obj.id}
            isHidden={selectedId !== null && selectedId !== obj.id}
            onMouseEnter={() => setHoveredId(obj.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => {
              if (selectedId === obj.id) {
                onDeselect();
              } else {
                onSelect(obj.id);
              }
            }}
          />
        ))}

        {/* Tap/click-to-deselect transparent overlay (behind polygons) — only when something selected */}
        {selectedId !== null && (
          <rect
            width={imgW}
            height={imgH}
            fill="transparent"
            style={{ cursor: 'default', pointerEvents: 'all', touchAction: 'manipulation' }}
            onClick={onDeselect}
            onTouchEnd={(e) => {
              e.preventDefault();
              onDeselect();
            }}
          />
        )}
      </svg>

      {/* Hover tooltip — HTML overlay aligned to centroid */}
      {hoveredObj && (
        <div
          className="absolute pointer-events-none z-10"
          style={{
            left: `${(hoveredObj.centroid[0] / imgW) * 100}%`,
            top: `${(hoveredObj.centroid[1] / imgH) * 100}%`,
            transform: 'translate(-50%, -120%)',
          }}
        >
          <div className="flex items-center gap-1.5 bg-zinc-900/95 backdrop-blur-sm border border-zinc-700/60 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap animate-fade-in">
            <span
              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: hoveredObj.color.raw }}
            />
            {hoveredObj.className}
            <span className="text-zinc-400 font-normal">
              {(hoveredObj.score * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}

      {/* Selected object label badge */}
      {selectedObj && (
        <div
          className="absolute pointer-events-none z-10"
          style={{
            left: `${(selectedObj.centroid[0] / imgW) * 100}%`,
            top: `${(selectedObj.centroid[1] / imgH) * 100}%`,
            transform: 'translate(-50%, -120%)',
          }}
        >
          <div
            className="flex items-center gap-1.5 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap animate-fade-in border"
            style={{
              backgroundColor: `${selectedObj.color.raw}22`,
              borderColor: `${selectedObj.color.raw}66`,
              boxShadow: `0 0 16px ${selectedObj.color.raw}33`,
            }}
          >
            <span
              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: selectedObj.color.raw }}
            />
            {selectedObj.className} selected
          </div>
        </div>
      )}

      {/* Deselect hint — min 44×44px tap target */}
      {selectedId !== null && (
        <button
          onClick={onDeselect}
          className="absolute top-2 right-2 md:top-3 md:right-3 z-20 min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/50 text-zinc-400 hover:text-zinc-200 active:text-zinc-200 text-xs px-3 py-2 rounded-lg transition-colors duration-150"
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear
        </button>
      )}
    </div>
  );
}
