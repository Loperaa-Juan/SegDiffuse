export function isPointInPolygon(
  px: number,
  py: number,
  polygon: number[][]
): boolean {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersects =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function computeCentroid(polygon: number[][]): [number, number] {
  const n = polygon.length;
  if (n === 0) return [0, 0];
  const [sx, sy] = polygon.reduce(
    ([ax, ay], [px, py]) => [ax + px, ay + py],
    [0, 0]
  );
  return [sx / n, sy / n];
}

export function polygonToSvgPoints(polygon: number[][]): string {
  return polygon.map(([x, y]) => `${x},${y}`).join(' ');
}
