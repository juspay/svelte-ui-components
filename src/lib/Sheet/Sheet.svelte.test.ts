import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { beforeAll, describe, expect, it } from 'vitest';
import Sheet from './Sheet.svelte';

// Sheet opens with transition:fly/fade, and Svelte 5 drives transitions through
// the Web Animations API, which jsdom does not implement. Stubbed here rather
// than in vitest-setup.ts: a global stub would apply to every suite in the repo
// and could hide a real animation fault in a component that is not under test.
beforeAll(() => {
  if (typeof Element.prototype.animate !== 'function') {
    // A test double for the two members Svelte's transition teardown touches.
    // `as unknown as Animation` matches how this repo's other suites stand in
    // for DOM types (tooltip-action.test.ts does the same); spelling out all
    // 21 Animation members would be noise for a stub nothing reads.
    const stub = { cancel: () => {}, finished: Promise.resolve() };
    Element.prototype.animate = () => stub as unknown as Animation;
  }
});

// `content` is a required snippet; Sheet renders it unconditionally.
const content = createRawSnippet(() => ({ render: () => '<p>Sheet body</p>' }));

// The overlay's accessible name is asserted end-to-end in
// tests/sheet-overlay-a11y.test.ts, which drives the real demo page. These
// cases live here instead because they are only reachable through the Svelte
// prop path: `<sui-sheet overlay-aria-label="">` maps an empty attribute to
// `undefined` before Sheet ever sees it, so the web component cannot express
// "explicitly passed an empty string" at all. Verified rather than assumed —
// the wc spelling of these cases passes with or without the fix.
describe('Sheet overlay accessible name', () => {
  const open = (overlayAriaLabel?: string): HTMLElement => {
    const { container } = render(Sheet, {
      open: true,
      dismissOnOutsideClick: true,
      overlayAriaLabel,
      content
    });
    const overlay = container.querySelector<HTMLElement>('.sheet-overlay');
    expect(overlay).not.toBeNull();
    return overlay as HTMLElement;
  };

  it('falls back to the default name when the override is an empty string', () => {
    // `??` forwards '' — leaving role="button" with aria-label="", announced
    // as an unnamed button. That is the exact defect the conditional role
    // exists to prevent, reintroduced through the override.
    expect(open('').getAttribute('aria-label')).toBe('Close sheet');
  });

  it('falls back when the override is whitespace only', () => {
    expect(open('   ').getAttribute('aria-label')).toBe('Close sheet');
  });

  it('still forwards a real override unchanged', () => {
    expect(open('Fermer').getAttribute('aria-label')).toBe('Fermer');
  });

  it('still uses the default when no override is passed', () => {
    expect(open().getAttribute('aria-label')).toBe('Close sheet');
  });
});
