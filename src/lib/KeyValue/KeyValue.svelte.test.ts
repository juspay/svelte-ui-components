// @vitest-environment jsdom
import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import KeyValue from './KeyValue.svelte';

const values = (container: HTMLElement): HTMLElement[] =>
  Array.from(container.querySelectorAll<HTMLElement>('dd.key-value-value'));

describe('KeyValue item title', () => {
  const items = [
    { label: 'Path', value: '~/…/app.ts', title: '/Users/demo/code/app.ts' },
    { label: 'Name', value: 'app.ts' }
  ];

  it('becomes the value cell’s native title', () => {
    const { container } = render(KeyValue, { items });
    expect(values(container)[0].getAttribute('title')).toBe('/Users/demo/code/app.ts');
  });

  it('leaves no title attribute at all on an item that has none', () => {
    const { container } = render(KeyValue, { items });
    expect(values(container)[1].hasAttribute('title')).toBe(false);
  });

  it('still applies when the value is rendered by a snippet', () => {
    const valueSnippet = createRawSnippet(() => ({ render: () => '<b class="mine">v</b>' }));
    const { container } = render(KeyValue, { items, valueSnippet });
    expect(values(container)[0].getAttribute('title')).toBe('/Users/demo/code/app.ts');
    expect(values(container)[0].querySelector('.mine')).not.toBeNull();
  });
});

// The title work touched the value cell and the stylesheet, so the structure a
// consumer already has is pinned here too.
describe('KeyValue default markup', () => {
  it('is a vertical, medium, two-column definition list', () => {
    const { container } = render(KeyValue, { items: [{ label: 'A', value: '1' }], testId: 'kv' });
    const list = container.querySelector('dl');
    expect(list?.classList.contains('key-value')).toBe(true);
    expect(list?.classList.contains('key-value--vertical')).toBe(true);
    expect(list?.classList.contains('key-value--md')).toBe(true);
    expect(list?.getAttribute('style')).toContain('--keyvalue-columns: 2');
    expect(list?.getAttribute('data-pw')).toBe('kv');
  });

  it('pairs each label with its value', () => {
    const { container } = render(KeyValue, {
      items: [
        { label: 'A', value: '1', testId: 'row-a' },
        { label: 'B', value: '2' }
      ]
    });
    const rows = Array.from(container.querySelectorAll('.key-value-item'));
    expect(rows.map((row) => row.querySelector('dt')?.textContent?.trim())).toEqual(['A', 'B']);
    expect(rows.map((row) => row.querySelector('dd')?.textContent?.trim())).toEqual(['1', '2']);
    expect(rows[0].getAttribute('data-pw')).toBe('row-a');
  });

  it('hides empty values by default and shows the placeholder when asked', () => {
    const items = [
      { label: 'Set', value: 'x' },
      { label: 'Empty', value: '   ' }
    ];
    const hidden = render(KeyValue, { items });
    expect(values(hidden.container)).toHaveLength(1);

    const shown = render(KeyValue, { items, hideEmpty: false });
    expect(values(shown.container).map((cell) => cell.textContent?.trim())).toEqual(['x', '—']);
  });

  it('takes its layout and size from props', () => {
    const { container } = render(KeyValue, {
      items: [{ label: 'A', value: '1' }],
      layout: 'horizontal',
      size: 'sm'
    });
    const list = container.querySelector('dl');
    expect(list?.classList.contains('key-value--horizontal')).toBe(true);
    expect(list?.classList.contains('key-value--sm')).toBe(true);
  });
});
