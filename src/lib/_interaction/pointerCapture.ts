export function capturePointer(owner: HTMLElement, pointerId: number): boolean {
  try {
    owner.setPointerCapture(pointerId);
    return true;
  } catch {
    // The pointer may have ended before a capture could be established.
    return false;
  }
}

export function releasePointer(owner: HTMLElement, pointerId: number): void {
  try {
    if (owner.hasPointerCapture(pointerId)) {
      owner.releasePointerCapture(pointerId);
    }
  } catch {
    // A detached handle or an ended pointer may already have lost capture.
  }
}
