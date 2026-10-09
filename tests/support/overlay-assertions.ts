import { expect, type Locator, type Page } from '@playwright/test';

/** Compare every declaration, including priority, independently of serialization order. */
export const inlineDeclarations = (page: Page, target: 'body' | 'html' = 'body') =>
  page.evaluate((tag) => {
    const style = (tag === 'body' ? document.body : document.documentElement).style;
    return Array.from(style)
      .sort()
      .map((name) => ({
        name,
        value: style.getPropertyValue(name),
        priority: style.getPropertyPriority(name)
      }));
  }, target);

/** Keep native pointer coverage while checking the focus actually saved before opening. */
export async function activateOverlay(opener: Locator, activation: 'pointer' | 'keyboard') {
  if (activation === 'keyboard') {
    await opener.focus();
    await expect(opener).toBeFocused();
    await opener.press('Enter');
    return () => expect(opener).toBeFocused();
  }
  await opener.evaluate((element) => {
    const capture = (event: MouseEvent) => {
      if (!event.composedPath().includes(element)) {
        return;
      }
      document.removeEventListener('click', capture, true);
      let active = document.activeElement;
      while (active?.shadowRoot?.activeElement) {
        active = active.shadowRoot.activeElement;
      }
      Reflect.set(element, '__overlayTestSavedFocus', active);
    };
    document.addEventListener('click', capture, true);
  });
  await opener.click();
  const savedFocus = await opener.evaluateHandle((element) => {
    const active = Reflect.get(element, '__overlayTestSavedFocus');
    Reflect.deleteProperty(element, '__overlayTestSavedFocus');
    if (!(active instanceof Element)) {
      throw new Error('Missing pre-overlay click focus witness');
    }
    return active;
  });
  return async () => {
    try {
      await expect
        .poll(() =>
          savedFocus.evaluate((saved) => {
            let active = saved.ownerDocument.activeElement;
            while (active?.shadowRoot?.activeElement) {
              active = active.shadowRoot.activeElement;
            }
            return active === saved;
          })
        )
        .toBe(true);
    } finally {
      await savedFocus.dispose();
    }
  };
}
