import { hexToRgb, hexToHsv, hsvToHex } from '$lib/utils';

export const DEFAULT_PALETTE = [
  '#4e79a7',
  '#f28e2b',
  '#e15759',
  '#76b7b2',
  '#59a14f',
  '#edc948',
  '#b07aa1',
  '#ff9da7',
  '#9c755f',
  '#bab0ac'
];

export function getColor(index: number, palette: string[] = DEFAULT_PALETTE): string {
  return palette[index % palette.length];
}

export function generatePalette(baseColor: string, count: number): string[] {
  const hsv = hexToHsv(baseColor);
  if (hsv === null) {
    return DEFAULT_PALETTE.slice(0, count);
  }

  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const h = (hsv.h + i / count) % 1;
    colors.push(hsvToHex(h, hsv.s, hsv.v));
  }
  return colors;
}

export function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (rgb === null) {
    return '#000000';
  }
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}
