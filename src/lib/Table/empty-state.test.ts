import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Table from './Table.svelte';
import type { TableColumn, TableEmptyContext, TableRow } from './properties';

/**
 * The states a real operational table has to tell apart.
 *
 * "No records yet" and "nothing matched your search" want different words and
 * offer different remedies — one says create something, the other says clear
 * the filter — and a consumer cannot distinguish them from `rows` alone once
 * the built-in search owns the term: both are simply zero rows. Table knows
 * which it is, so it now says.
 *
 * Loading, error/retry and partial results stay caller-owned compositions, as
 * the pack asks; what the library owes them is that the header, the row
 * identities and the scroll container do not move underneath a refresh, which
 * the last case here pins.
 */

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

const columns: TableColumn[] = [
  { id: 'name', label: 'Name' },
  { id: 'team', label: 'Team' }
];

const rows: TableRow[] = [
  { name: 'Alice', team: 'Platform' },
  { name: 'Bob', team: 'Design' }
];

/** Renders the reason and term it was handed, so the test reads what Table passed. */
const reasonProbe = createRawSnippet<[TableEmptyContext]>((context) => ({
  render: () =>
    `<span data-pw="empty-probe">${context().reason}|${context().searchTerm || 'none'}</span>`
}));

/** A pre-existing consumer's parameterless empty snippet, unchanged. */
const legacyProbe = createRawSnippet(() => ({
  render: () => `<span data-pw="empty-probe">Nothing here</span>`
}));

const probeText = (container: HTMLElement): string =>
  (container.querySelector('[data-pw="empty-probe"]')?.textContent ?? '').trim();

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Table empty state tells the consumer WHY', () => {
  it('reports no-rows when the source itself is empty', () => {
    const { container } = render(Table, {
      props: { columns, rows: [], empty: reasonProbe }
    });
    expect(probeText(container)).toBe('no-rows|none');
  });

  it('reports no-matches, with the term, when a search hid every row', () => {
    const { container } = render(Table, {
      props: {
        columns,
        rows,
        searchConfig: { searchTerm: 'zzz' },
        empty: reasonProbe
      }
    });
    expect(probeText(container)).toBe('no-matches|zzz');
  });

  it('reports no-matches under server search, where the empty page IS the answer', () => {
    const { container } = render(Table, {
      props: {
        columns,
        // The server filtered and found nothing, so the consumer's rows are
        // empty — the reason is still "nothing matched", not "no records".
        rows: [],
        searchConfig: { searchTerm: 'zzz' },
        onsearchchange: vi.fn(),
        empty: reasonProbe
      }
    });
    expect(probeText(container)).toBe('no-matches|zzz');
  });

  it('reports no-matches when a column filter is the thing hiding the rows', () => {
    const { container } = render(Table, {
      props: {
        columns: [
          columns[0],
          {
            ...columns[1],
            filter: { options: [{ label: 'Ops', value: 'ops' }], selectedValue: 'ops' }
          }
        ],
        rows: [],
        empty: reasonProbe
      }
    });
    expect(probeText(container)).toBe('no-matches|none');
  });

  it('still renders a parameterless empty snippet from before this contract', () => {
    const { container } = render(Table, {
      props: { columns, rows: [], empty: legacyProbe }
    });
    expect(probeText(container)).toBe('Nothing here');
  });

  it('keeps the header and the scroll container mounted while empty', () => {
    const { container } = render(Table, {
      props: { columns, rows: [], empty: reasonProbe }
    });
    // A state that replaces the whole table loses the column labels and resets
    // the reader's horizontal scroll; the empty message belongs in the body.
    expect([...container.querySelectorAll('th')].map((th) => th.textContent?.trim())).toEqual([
      'Name',
      'Team'
    ]);
    expect(container.querySelector('.table-scroll')).not.toBeNull();
  });

  it('keeps row identity and the header across a refresh that replaces the rows', async () => {
    const { container, rerender } = render(Table, {
      props: { columns, rows, empty: reasonProbe }
    });
    const firstRowBefore = container.querySelector('tbody tr');

    // The shape of a caller-owned refetch: same records, new array.
    await rerender({ rows: rows.map((row) => ({ ...row })) });

    expect(container.querySelector('tbody tr')).toBe(firstRowBefore);
    expect(
      [...container.querySelectorAll('tbody tr td:first-child')].map((td) => td.textContent)
    ).toEqual(['Alice', 'Bob']);
  });
});
