export function nextEnabledIndex(
  count: number,
  from: number,
  step: number,
  loop: boolean,
  isDisabled?: (index: number) => boolean
): number {
  let index = from;
  for (let moved = 0; moved < count; moved += 1) {
    index += step;
    if (index < 0 || index >= count) {
      if (!loop) {
        return -1;
      }
      index = ((index % count) + count) % count;
    }
    if (isDisabled?.(index) !== true) {
      return index;
    }
  }
  return -1;
}
