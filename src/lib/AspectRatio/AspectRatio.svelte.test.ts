import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import AspectRatio from './AspectRatio.svelte';

const content = createRawSnippet(() => ({ render: () => '<p>Content</p>' }));

const getContainer = (element: HTMLElement): HTMLElement => {
  const container = element.querySelector<HTMLElement>('.container');
  expect(container).not.toBeNull();
  if (container === null) {
    throw new Error('AspectRatio root .container not found');
  }
  return container;
};

describe('AspectRatio default ratio', () => {
  it('renders a 1 (square) aspect-ratio when ratio is omitted', () => {
    const { container } = render(AspectRatio, {});
    const root = getContainer(container);
    expect(root.style.aspectRatio).toBe('var(--aspect-ratio-container-aspect-ratio, 1)');
  });
});

describe('AspectRatio custom ratio', () => {
  it('reflects a valid ratio (16 / 9) into the aspect-ratio custom property fallback', () => {
    const { container } = render(AspectRatio, { ratio: 16 / 9 });
    const root = getContainer(container);
    expect(root.style.aspectRatio).toBe(`var(--aspect-ratio-container-aspect-ratio, ${16 / 9})`);
  });
});

// `ratio` feeds directly into a CSS declaration; a value with no valid geometric
// meaning (or that would serialize to a non-numeric CSS token) must never reach the
// stylesheet as-is, or the browser drops the whole declaration silently.
describe('AspectRatio invalid ratio guards', () => {
  it.each([
    ['zero', 0],
    ['negative', -2],
    ['NaN', NaN],
    ['Infinity', Infinity],
    ['-Infinity', -Infinity]
  ])('falls back to the default ratio of 1 when ratio is %s', (_label, ratio) => {
    const { container } = render(AspectRatio, { ratio });
    const root = getContainer(container);
    expect(root.style.aspectRatio).toBe('var(--aspect-ratio-container-aspect-ratio, 1)');
  });
});

describe('AspectRatio content', () => {
  it('renders the children snippet inside the container', () => {
    const { container } = render(AspectRatio, { children: content });
    const root = getContainer(container);
    expect(root.querySelector('p')?.textContent).toBe('Content');
  });

  it('renders no content when children is omitted, keeping the reserved space', () => {
    const { container } = render(AspectRatio, {});
    const root = getContainer(container);
    expect(root.textContent).toBe('');
  });
});

describe('AspectRatio classes and testId', () => {
  it('appends classes to the root element', () => {
    const { container } = render(AspectRatio, { classes: 'my-ratio' });
    const root = getContainer(container);
    expect(root.classList.contains('my-ratio')).toBe(true);
    expect(root.classList.contains('container')).toBe(true);
  });

  it('emits testId as both data-pw and testID on the root element', () => {
    const { container } = render(AspectRatio, { testId: 'ratio-demo' });
    const root = getContainer(container);
    expect(root.getAttribute('data-pw')).toBe('ratio-demo');
    expect(root.getAttribute('testID')).toBe('ratio-demo');
  });

  it('omits data-pw and testID when testId is not provided', () => {
    const { container } = render(AspectRatio, {});
    const root = getContainer(container);
    expect(root.hasAttribute('data-pw')).toBe(false);
    expect(root.hasAttribute('testID')).toBe(false);
  });
});
