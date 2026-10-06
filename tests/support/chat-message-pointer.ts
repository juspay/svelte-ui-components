import type { Locator } from '@playwright/test';

/** Find a real body hit without activating a link or disclosure control. */
export async function chatMessageBodyPoint(bubble: Locator): Promise<{ x: number; y: number }> {
  await bubble.scrollIntoViewIfNeeded();
  const box = await bubble.boundingBox();
  if (box === null) {
    throw new Error('ChatMessage has no visible bounding box');
  }
  return bubble.evaluate((element, box) => {
    const body = element.querySelector('.body');
    if (body === null) {
      throw new Error('ChatMessage has no body to click');
    }
    const bodyRect = body.getBoundingClientRect();
    const style = getComputedStyle(element);
    // Click offsets use Playwright's protocol box. Its fractional precision can
    // differ from DOMRect enough for Firefox to hit the adjacent control pixel.
    const originX = box.x + Number.parseFloat(style.borderLeftWidth);
    const originY = box.y + Number.parseFloat(style.borderTopWidth);
    const controls =
      'a[href],button,input,select,textarea,summary,[role="button"],[role="link"],[tabindex],[contenteditable="true"]';
    for (const fy of [0.5, 0.25, 0.75]) {
      for (const fx of [0.5, 0.25, 0.75]) {
        // A fractional pointer can round outside the old 5px corner offset.
        // Choose a viewport pixel inside the rendered body instead.
        const x = Math.round(bodyRect.left + bodyRect.width * fx);
        const y = Math.round(bodyRect.top + bodyRect.height * fy);
        const hit = document.elementFromPoint(x, y);
        if (hit === null || !element.contains(hit)) {
          continue;
        }
        const control = hit.closest(controls);
        if (control !== null && element.contains(control)) {
          continue;
        }
        // Playwright's explicit click position starts at the padding box.
        return {
          x: x - originX,
          y: y - originY
        };
      }
    }
    throw new Error('ChatMessage body has no noninteractive painted hit target');
  }, box);
}
