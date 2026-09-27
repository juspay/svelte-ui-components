import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import EmptyState from './EmptyState.svelte';

/**
 * `headingLevel` is additive: unset (or not a real 1-6 level) the title stays
 * the plain div every version before it rendered.
 */
const title = (container: HTMLElement): HTMLElement | null =>
  container.querySelector('.empty-state-title');

describe('EmptyState headingLevel', () => {
  it('keeps a div title when unset', () => {
    const { container } = render(EmptyState, { title: 'Nothing here' });
    expect(title(container)?.tagName).toBe('DIV');
    expect(title(container)?.textContent?.trim()).toBe('Nothing here');
  });

  it('renders the title as the requested heading', () => {
    const { container } = render(EmptyState, { title: 'Nothing here', headingLevel: 4 });
    const node = title(container);
    expect(node?.tagName).toBe('H4');
    expect(node?.textContent?.trim()).toBe('Nothing here');
  });

  it('falls back to a div for a level outside 1-6', () => {
    // A web-component attribute can hand over any number.
    const { container } = render(EmptyState, {
      title: 'Nothing here',
      headingLevel: 7 as unknown as 4
    });
    expect(title(container)?.tagName).toBe('DIV');
  });
});
