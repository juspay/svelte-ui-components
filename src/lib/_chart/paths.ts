import type { Point, CurveType } from './types';

export function arcPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number
): string {
  const fullCircle = Math.abs(endAngle - startAngle) >= Math.PI * 2 - 0.001;

  if (fullCircle) {
    if (innerR > 0) {
      return (
        `M ${cx + outerR} ${cy}` +
        `A ${outerR} ${outerR} 0 1 1 ${cx - outerR} ${cy}` +
        `A ${outerR} ${outerR} 0 1 1 ${cx + outerR} ${cy}` +
        `M ${cx + innerR} ${cy}` +
        `A ${innerR} ${innerR} 0 1 0 ${cx - innerR} ${cy}` +
        `A ${innerR} ${innerR} 0 1 0 ${cx + innerR} ${cy}Z`
      );
    }
    return (
      `M ${cx + outerR} ${cy}` +
      `A ${outerR} ${outerR} 0 1 1 ${cx - outerR} ${cy}` +
      `A ${outerR} ${outerR} 0 1 1 ${cx + outerR} ${cy}Z`
    );
  }

  const x1 = cx + outerR * Math.cos(startAngle);
  const y1 = cy + outerR * Math.sin(startAngle);
  const x2 = cx + outerR * Math.cos(endAngle);
  const y2 = cy + outerR * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  if (innerR > 0) {
    const x3 = cx + innerR * Math.cos(endAngle);
    const y3 = cy + innerR * Math.sin(endAngle);
    const x4 = cx + innerR * Math.cos(startAngle);
    const y4 = cy + innerR * Math.sin(startAngle);
    return (
      `M ${x1} ${y1}` +
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}` +
      `L ${x3} ${y3}` +
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}Z`
    );
  }

  return `M ${cx} ${cy}` + `L ${x1} ${y1}` + `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}Z`;
}

function linearPath(points: Point[]): string {
  if (points.length === 0) {
    return '';
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  return d;
}

function stepPath(points: Point[]): string {
  if (points.length === 0) {
    return '';
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const midX = (points[i - 1].x + points[i].x) / 2;
    d += ` L ${midX} ${points[i - 1].y} L ${midX} ${points[i].y}`;
  }
  if (points.length > 1) {
    d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  }
  return d;
}

function monotoneTangents(points: Point[]): number[] {
  const n = points.length;
  const slopes: number[] = [];
  const tangents: number[] = new Array(n);

  for (let i = 0; i < n - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    slopes.push(dx === 0 ? 0 : (points[i + 1].y - points[i].y) / dx);
  }

  tangents[0] = slopes[0] ?? 0;
  tangents[n - 1] = slopes[n - 2] ?? 0;

  for (let i = 1; i < n - 1; i++) {
    if (slopes[i - 1] * slopes[i] <= 0) {
      tangents[i] = 0;
    } else {
      tangents[i] = (slopes[i - 1] + slopes[i]) / 2;
    }
  }

  // Fritsch-Carlson: ensure monotonicity
  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(slopes[i]) < 1e-10) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
    } else {
      const alpha = tangents[i] / slopes[i];
      const beta = tangents[i + 1] / slopes[i];
      const s = alpha * alpha + beta * beta;
      if (s > 9) {
        const t = 3 / Math.sqrt(s);
        tangents[i] = t * alpha * slopes[i];
        tangents[i + 1] = t * beta * slopes[i];
      }
    }
  }

  return tangents;
}

function monotonePath(points: Point[]): string {
  if (points.length === 0) {
    return '';
  }
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }
  if (points.length === 2) {
    return linearPath(points);
  }

  const tangents = monotoneTangents(points);
  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const dx = (points[i + 1].x - points[i].x) / 3;
    const cp1x = points[i].x + dx;
    const cp1y = points[i].y + dx * tangents[i];
    const cp2x = points[i + 1].x - dx;
    const cp2y = points[i + 1].y - dx * tangents[i + 1];
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i + 1].x} ${points[i + 1].y}`;
  }

  return d;
}

export function linePath(points: Point[], curve: CurveType = 'linear'): string {
  if (points.length < 2) {
    return points.length === 1 ? `M ${points[0].x} ${points[0].y}` : '';
  }
  switch (curve) {
    case 'monotone':
    case 'natural':
      return monotonePath(points);
    case 'step':
      return stepPath(points);
    default:
      return linearPath(points);
  }
}

export function areaPath(points: Point[], baseline: number, curve: CurveType = 'linear'): string {
  if (points.length === 0) {
    return '';
  }
  const topPath = linePath(points, curve);
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  return topPath + ` L ${lastPoint.x} ${baseline} L ${firstPoint.x} ${baseline} Z`;
}
