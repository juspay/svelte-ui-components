/** Geometry observations, independent of the shell's document-width predicate. */
export function clippedControls(): {
  name: string;
  clippedBy: string;
  rect: ReturnType<DOMRect['toJSON']>;
}[] {
  const observations: { name: string; clippedBy: string; rect: ReturnType<DOMRect['toJSON']> }[] =
    [];
  for (const control of document.querySelectorAll<HTMLElement>(
    'main button, main input, main select, main textarea, main [role="combobox"], main [role="checkbox"], main [role="button"], main [role="switch"], main [role="radio"]'
  )) {
    if (
      control.closest('[hidden], [inert], [aria-hidden="true"]') ||
      !control.checkVisibility({ visibilityProperty: true })
    ) {
      continue;
    }
    const rect = control.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      continue;
    }
    let clippedBy: string | null = rect.right > innerWidth + 1 ? 'viewport' : null;
    for (let ancestor = control.parentElement; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor);
      if (style.overflowX === 'auto' || style.overflowX === 'scroll') {
        // Intentional widget scrolling is verified separately with native keys.
        clippedBy = null;
        break;
      }
      const clip = ancestor.getBoundingClientRect();
      if (
        (style.overflowX === 'hidden' || style.overflowX === 'clip') &&
        (rect.left < clip.left - 1 || rect.right > clip.right + 1)
      ) {
        clippedBy = ancestor.className || ancestor.tagName;
        break;
      }
    }
    if (clippedBy !== null) {
      observations.push({
        name: control.getAttribute('aria-label') ?? control.textContent?.trim() ?? '',
        clippedBy,
        rect: rect.toJSON()
      });
    }
  }
  return observations;
}
