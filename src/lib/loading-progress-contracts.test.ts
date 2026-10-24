import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import Loader from './Loader/Loader.svelte';
import Progress from './Progress/Progress.svelte';

describe('loading and segmented progress contracts', () => {
  it('keeps the default loader visually empty and without unsolicited status announcements', () => {
    const view = render(Loader, { testId: 'loading' });
    expect(view.container.querySelector('[data-pw="loading"]')?.textContent).toBe('');
    expect(view.queryByRole('status')).toBeNull();
  });
  it.each(['border', 'orbit'] as const)('names standalone %s loading status', (variant) => {
    const view = render(Loader, { variant, ariaLabel: 'Loading orders' });
    expect(view.getByRole('status', { name: 'Loading orders' })).toBeTruthy();
  });
  it('fills complete segments while retaining a precise accessible value', () => {
    const view = render(Progress, { value: 35, segments: 3, ariaLabel: 'Product tour' });
    expect(view.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('35');
    expect(view.container.querySelectorAll('.segment')).toHaveLength(3);
    expect(view.container.querySelectorAll('.segment.filled')).toHaveLength(2);
  });
  it('keeps the existing continuous track when segmentation is not requested', () => {
    const view = render(Progress, { value: 40 });
    expect(view.container.querySelectorAll('.segment')).toHaveLength(0);
    expect(view.container.querySelector('.bar')?.getAttribute('style')).toContain('40%');
  });
  it('keeps negative values indeterminate even with segments requested', () => {
    const view = render(Progress, { value: -1, segments: 3 });
    expect(view.getByRole('progressbar').getAttribute('aria-valuetext')).toBe('indeterminate');
    expect(view.container.querySelectorAll('.segment')).toHaveLength(0);
  });
  it('lets trailing content replace the percentage label without extra wrappers', () => {
    const view = render(Progress, {
      value: 40,
      showLabel: true,
      trailingLabel: createRawSnippet(() => ({ render: () => '<span>03</span>' }))
    });
    const label = view.getByText('03');
    expect(label.parentElement).toBe(view.getByRole('progressbar'));
    expect(view.queryByText('40%')).toBeNull();
  });
});
