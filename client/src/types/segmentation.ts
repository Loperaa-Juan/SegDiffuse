export interface SegmentationResponse {
  num_objects: number;
  labels: number[];
  scores: number[];
  class_names: string[];
  masks: string[];
  polygons: number[][][]; // [objectIdx][pointIdx][x|y]
}

export interface ObjectColor {
  fill: string;
  fillHovered: string;
  fillSelected: string;
  stroke: string;
  strokeHovered: string;
  raw: string; // solid color for UI chips
}

export interface DetectedObject {
  id: number;
  label: number;
  score: number;
  className: string;
  mask: string;
  polygon: number[][];
  color: ObjectColor;
  centroid: [number, number];
}

export type AppPhase =
  | 'upload'
  | 'preview'
  | 'segmenting'
  | 'segmented'
  | 'selected'
  | 'prompting'
  | 'inpainting'
  | 'inpainted';

export interface InpaintingResult {
  imageUrl: string;
  prompt: string;
  objectId: number;
}
