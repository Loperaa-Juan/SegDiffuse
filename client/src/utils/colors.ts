import type { ObjectColor } from '../types/segmentation';

const PALETTE: Array<{ raw: string; r: number; g: number; b: number }> = [
  { raw: '#6366f1', r: 99, g: 102, b: 241 },  // indigo
  { raw: '#10b981', r: 16, g: 185, b: 129 },  // emerald
  { raw: '#f59e0b', r: 245, g: 158, b: 11 },  // amber
  { raw: '#ef4444', r: 239, g: 68, b: 68 },   // red
  { raw: '#ec4899', r: 236, g: 72, b: 153 },  // pink
  { raw: '#06b6d4', r: 6, g: 182, b: 212 },   // cyan
  { raw: '#84cc16', r: 132, g: 204, b: 22 },  // lime
  { raw: '#f97316', r: 249, g: 115, b: 22 },  // orange
  { raw: '#a855f7', r: 168, g: 85, b: 247 },  // purple
  { raw: '#14b8a6', r: 20, g: 184, b: 166 },  // teal
];

export function getObjectColor(index: number): ObjectColor {
  const { r, g, b, raw } = PALETTE[index % PALETTE.length];
  return {
    raw,
    fill: `rgba(${r},${g},${b},0.25)`,
    fillHovered: `rgba(${r},${g},${b},0.5)`,
    fillSelected: `rgba(${r},${g},${b},0.2)`,
    stroke: `rgba(${r},${g},${b},0.85)`,
    strokeHovered: `rgba(${r},${g},${b},1)`,
  };
}
