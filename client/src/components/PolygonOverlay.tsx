import type { DetectedObject } from '../types/segmentation';
import { polygonToSvgPoints } from '../utils/geometry';

interface PolygonOverlayProps {
  object: DetectedObject;
  isHovered: boolean;
  isSelected: boolean;
  isHidden: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

export function PolygonOverlay({
  object,
  isHovered,
  isSelected,
  isHidden,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: PolygonOverlayProps) {
  const { color, polygon } = object;
  const points = polygonToSvgPoints(polygon);

  if (isHidden) return null;

  const handleTouchStart = () => {
    // Mirror hover state on touch so the visual highlight activates immediately
    onMouseEnter();
  };

  const handleTouchEnd = (e: React.TouchEvent<SVGPolygonElement>) => {
    // Prevent the synthesised mouse click that browsers fire after touchend
    // (300ms delay) — we fire onClick ourselves immediately.
    e.preventDefault();
    onMouseLeave();
    onClick();
  };

  return (
    <polygon
      points={points}
      fill={isHovered || isSelected ? color.fillHovered : color.fill}
      stroke={isHovered || isSelected ? color.strokeHovered : color.stroke}
      strokeWidth={isHovered || isSelected ? 2.5 : 1.5}
      strokeLinejoin="round"
      opacity={isSelected ? 1 : isHovered ? 0.95 : 0.8}
      className="polygon-transition cursor-pointer"
      style={{ pointerEvents: 'all', touchAction: 'manipulation' }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    />
  );
}
