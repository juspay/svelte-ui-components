export function formatNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e9) {
    return (value / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (abs >= 1e6) {
    return (value / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (abs >= 1e3) {
    return (value / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(1);
}

export function formatPercent(value: number, total: number): string {
  if (total === 0) {
    return '0%';
  }
  return Math.round((value / total) * 100) + '%';
}

export function defaultTickFormat(value: number | string): string {
  if (typeof value === 'string') {
    return value;
  }
  return formatNumber(value);
}

export function formatNumberIndian(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e7) {
    return (value / 1e7).toFixed(2).replace(/\.?0+$/, '') + 'Cr';
  }
  if (abs >= 1e5) {
    return (value / 1e5).toFixed(2).replace(/\.?0+$/, '') + 'L';
  }
  if (abs >= 1e3) {
    return (value / 1e3).toFixed(2).replace(/\.?0+$/, '') + 'K';
  }
  return value.toLocaleString('en-IN');
}
