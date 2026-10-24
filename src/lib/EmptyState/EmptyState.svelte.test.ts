import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import EmptyState from './EmptyState.svelte';
import { createRawSnippet } from 'svelte';

/**
 * `headingLevel` is additive: unset (or not a real 1-6 level) the title stays
 * the plain div every version before it rendered.
 */
const title = (container: HTMLElement): HTMLElement | null =>
  container.querySelector('.empty-state-title');

describe('EmptyState headingLevel', () => {
  it('preserves fallback headings and descriptions without imposing a styled layout', () => {
    const { container, getByRole, getByText } = render(EmptyState, {
      unstyled: true,
      title: 'No orders yet',
      headingLevel: 2,
      description: 'Your orders appear here.',
      classes: 'consumer-layout',
      testId: 'empty'
    });
    const root = container.querySelector('.consumer-layout')!;
    expect(root.classList.contains('empty-state')).toBe(false);
    expect(root.getAttribute('data-pw')).toBe('empty');
    expect(getByRole('heading', { level: 2 }).parentElement).toBe(root);
    expect(getByText('Your orders appear here.').parentElement).toBe(root);
  });

  it('renders authored snippets directly and restores default slot wrappers when styled', async () => {
    const snippets = {
      title: '',
      icon: createRawSnippet(() => ({ render: () => '<span>Illustration</span>' })),
      titleSnippet: createRawSnippet(() => ({ render: () => '<h2>Nothing here</h2>' })),
      descriptionSnippet: createRawSnippet(() => ({ render: () => '<p>Try again later.</p>' })),
      children: createRawSnippet(() => ({ render: () => '<button>Explore</button>' })),
      classes: 'consumer-layout'
    };
    const view = render(EmptyState, { ...snippets, unstyled: true });
    const root = view.container.querySelector('.consumer-layout')!;
    expect(Array.from(root.children).map((child) => child.tagName)).toEqual([
      'SPAN',
      'H2',
      'P',
      'BUTTON'
    ]);
    await view.rerender({ ...snippets, unstyled: false });
    expect(root.classList.contains('empty-state')).toBe(true);
    expect(view.getByRole('heading').parentElement?.className).toContain('empty-state-title');
    expect(view.getByRole('button').parentElement?.className).toContain('empty-state-actions');
  });

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
