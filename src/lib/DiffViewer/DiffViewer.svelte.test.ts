// @vitest-environment jsdom
import { fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';
import DiffViewer from './DiffViewer.svelte';
import type { DiffViewerHunk } from './properties';

const lines = (count: number): DiffViewerHunk['lines'] =>
  Array.from({ length: count }, (_, i) => ({
    kind: 'context' as const,
    oldLine: i + 1,
    newLine: i + 1,
    text: `line ${i + 1}`
  }));
const hunk = (count: number, header?: string): DiffViewerHunk =>
  typeof header === 'string' ? { header, lines: lines(count) } : { lines: lines(count) };

const base = { path: 'apps/web/src/app.ts', additions: 0, deletions: 0 };
const body = (container: HTMLElement): HTMLElement | null => container.querySelector('.diff-body');
const trigger = (container: HTMLElement): HTMLElement => {
  const node = container.querySelector('.accordion-trigger');
  if (!(node instanceof HTMLElement)) {
    throw new Error('DiffViewer trigger is missing');
  }
  return node;
};
const showButton = (container: HTMLElement): HTMLButtonElement | null =>
  container.querySelector('button.diff-show, .diff-show button, .diff-viewer > button');
const click = async (node: Element): Promise<void> => {
  await fireEvent.click(node);
  await tick();
};

describe('DiffViewer header', () => {
  it('splits the path into a directory and a file name', () => {
    const { container } = render(DiffViewer, { ...base, hunks: [hunk(2)] });
    expect(container.querySelector('.directory')?.textContent).toBe('apps/web/src/');
    expect(container.querySelector('.name')?.textContent).toBe('app.ts');
  });

  it('shows a count only when it is non-zero', () => {
    const { container } = render(DiffViewer, {
      ...base,
      additions: 3,
      deletions: 0,
      hunks: [hunk(2)]
    });
    expect(container.querySelector('.add')?.textContent).toBe('+3');
    expect(container.querySelector('.del')).toBeNull();
  });

  it('badges a created file', () => {
    const { container } = render(DiffViewer, { ...base, created: true, hunks: [hunk(2)] });
    expect(container.querySelector('.path')?.textContent).toContain('new');
  });
});

describe('DiffViewer lines', () => {
  it('renders each line with its kind, numbers and diff marker', () => {
    const { container } = render(DiffViewer, {
      ...base,
      hunks: [
        {
          lines: [
            { kind: 'context', oldLine: 1, newLine: 1, text: 'keep' },
            { kind: 'remove', oldLine: 2, text: 'old' },
            { kind: 'add', newLine: 2, text: 'new' }
          ]
        }
      ]
    });
    const rendered = Array.from(container.querySelectorAll('.diff-line')).map((el) => ({
      kind: el.getAttribute('data-kind'),
      nums: Array.from(el.querySelectorAll('.num')).map((n) => n.textContent),
      content: el.querySelector('.content')?.textContent
    }));
    expect(rendered).toEqual([
      { kind: 'context', nums: ['1', '1'], content: ' keep' },
      { kind: 'remove', nums: ['2', ''], content: '-old' },
      { kind: 'add', nums: ['', '2'], content: '+new' }
    ]);
  });

  it('separates hunks, using the header when there is one', () => {
    const { container } = render(DiffViewer, {
      ...base,
      hunks: [hunk(1), hunk(1), hunk(1, '@@ -40,3 +40,3 @@')]
    });
    const separators = Array.from(container.querySelectorAll('.hunk-sep')).map(
      (el) => el.textContent
    );
    expect(separators).toEqual(['⋯', '@@ -40,3 +40,3 @@']);
  });
});

describe('DiffViewer collapse threshold', () => {
  it('starts open at or under the threshold, with no show control', () => {
    const { container } = render(DiffViewer, {
      ...base,
      hunks: [hunk(4)],
      collapseThreshold: 4
    });
    expect(body(container)).not.toBeNull();
    expect(showButton(container)).toBeNull();
  });

  it('starts collapsed over the threshold, without mounting the body', () => {
    const { container } = render(DiffViewer, {
      ...base,
      hunks: [hunk(5)],
      collapseThreshold: 4
    });
    expect(body(container)).toBeNull();
    expect(showButton(container)?.textContent).toContain('5 lines');
  });

  it('opens from the show control, and the control goes away', async () => {
    const { container } = render(DiffViewer, {
      ...base,
      hunks: [hunk(5)],
      collapseThreshold: 4
    });
    const show = showButton(container);
    expect(show).not.toBeNull();
    if (show !== null) {
      await click(show);
    }
    expect(body(container)).not.toBeNull();
    expect(showButton(container)).toBeNull();
  });

  // The body is not torn down on collapse: a remount would reset its
  // horizontal scroll position every time the diff reopened.
  it('keeps the same body node mounted across a collapse and a reopen', async () => {
    const { container } = render(DiffViewer, { ...base, hunks: [hunk(3)] });
    const first = body(container);
    expect(first).not.toBeNull();
    await click(trigger(container));
    expect(body(container)).toBe(first);
    await click(trigger(container));
    expect(body(container)).toBe(first);
  });

  it('keeps the reader’s toggle while the diff is unchanged, and resets when its size changes', async () => {
    const { container, rerender } = render(DiffViewer, {
      ...base,
      hunks: [hunk(5)],
      collapseThreshold: 4
    });
    const show = showButton(container);
    if (show !== null) {
      await click(show);
    }
    expect(trigger(container).getAttribute('aria-expanded')).toBe('true');

    await rerender({ ...base, hunks: [hunk(5)], collapseThreshold: 4 });
    expect(trigger(container).getAttribute('aria-expanded')).toBe('true');

    await rerender({ ...base, hunks: [hunk(9)], collapseThreshold: 4 });
    expect(trigger(container).getAttribute('aria-expanded')).toBe('false');
  });
});
