import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Table from './Table.svelte';
import type { TableColumn, TableRow } from './properties';

/**
 * Who owns the current page, and what happens when the row count changes
 * from outside.
 *
 * Client pagination took its page from an internal override that nothing
 * clamped, so replacing 23 rows with 5 while the reader sat on page 3 produced
 * an empty slice and a range that read "21-5 of 5" — a page past the end of the
 * data, unreachable and untrue. Server pagination has the opposite obligation:
 * the page and page size there are the consumer's, and Table's controls are
 * requests it may refuse.
 */

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

const columns: TableColumn[] = [
  { id: 'name', label: 'Name' },
  { id: 'score', label: 'Score' }
];

const makeRows = (count: number, prefix = 'Item'): TableRow[] =>
  Array.from({ length: count }, (_unused, index) => ({
    name: `${prefix} ${String(index + 1).padStart(2, '0')}`,
    score: index + 1
  }));

const bodyNames = (container: HTMLElement): string[] =>
  [...container.querySelectorAll('tbody tr')].map((row) =>
    (row.querySelectorAll('td')[0]?.textContent ?? '').trim()
  );

const rangeText = (container: HTMLElement): string =>
  (container.querySelector('.table-paginator-range')?.textContent ?? '').trim();

/** Narrows a query result so a missing node fails the test, not the compiler. */
const required = <T>(value: T | null, what: string): T => {
  if (value === null) {
    throw new Error(`expected ${what} to be in the document`);
  }
  return value;
};

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Table client pagination resolves an external shrink', () => {
  it('lands on the last page that has rows instead of a blank page past the end', async () => {
    const onPageChange = vi.fn();
    const { container, getByRole, rerender } = render(Table, {
      props: {
        columns,
        rows: makeRows(23),
        pagination: { pageSize: 5, showFooterOnSinglePage: true, onPageChange }
      }
    });

    await fireEvent.click(getByRole('button', { name: 'Page 5' }));
    expect(rangeText(container)).toBe('21-23 of 23');
    onPageChange.mockClear();

    // The consumer replaces the dataset from outside — a delete, a refetch, a
    // filter applied upstream. Page 5 no longer exists.
    await rerender({ rows: makeRows(5) });

    expect(bodyNames(container)).toEqual(['Item 01', 'Item 02', 'Item 03', 'Item 04', 'Item 05']);
    expect(rangeText(container)).toBe('1-5 of 5');
    // Resolving a page nobody asked to change is a display decision, not a
    // page-change request: emitting one would hand the consumer a page event
    // it never triggered.
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('resolves to a middle page when one still exists', async () => {
    const { container, getByRole, rerender } = render(Table, {
      props: { columns, rows: makeRows(23), pagination: { pageSize: 5 } }
    });

    await fireEvent.click(getByRole('button', { name: 'Page 5' }));
    await rerender({ rows: makeRows(12) });

    expect(rangeText(container)).toBe('11-12 of 12');
    expect(bodyNames(container)).toEqual(['Item 11', 'Item 12']);
  });

  it('renders no rows and no leftover range when the dataset empties', async () => {
    const { container, getByRole, rerender } = render(Table, {
      props: {
        columns,
        rows: makeRows(23),
        pagination: { pageSize: 5, showFooterOnSinglePage: true }
      }
    });

    await fireEvent.click(getByRole('button', { name: 'Page 5' }));
    await rerender({ rows: [] });

    expect(bodyNames(container)).toEqual([]);
    // No "21-0 of 0": an empty dataset has no range to report.
    expect(rangeText(container)).toBe('');
    expect(container.querySelector('[aria-current="page"]')?.textContent?.trim()).toBe('1');
  });

  it('puts the reader back on their chosen page when the data grows again', async () => {
    const { container, getByRole, rerender } = render(Table, {
      props: {
        columns,
        rows: makeRows(23),
        pagination: { pageSize: 5, showFooterOnSinglePage: true }
      }
    });

    await fireEvent.click(getByRole('button', { name: 'Page 5' }));
    await rerender({ rows: makeRows(5) });
    expect(rangeText(container)).toBe('1-5 of 5');

    // Resolving a too-large page is a decision taken per render, not a
    // write-back that throws the chosen page away: a dataset that shrinks and
    // comes back — a refetch, a filter widening again — must not quietly
    // relocate the reader to page 1.
    await rerender({ rows: makeRows(23) });
    expect(rangeText(container)).toBe('21-23 of 23');
    expect(bodyNames(container)[0]).toBe('Item 21');
  });

  it('an index-shifted page still addresses the consumer row it displays', async () => {
    const clicked: Array<[number, number]> = [];
    const { container, getByRole, rerender } = render(Table, {
      props: {
        columns,
        rows: makeRows(23),
        pagination: { pageSize: 5 },
        onrowclick: (rowIndex: number, _row: unknown, originalIndex: number) => {
          clicked.push([rowIndex, originalIndex]);
        }
      }
    });

    await fireEvent.click(getByRole('button', { name: 'Page 5' }));
    await rerender({ rows: makeRows(12) });

    // Page 3 of the shrunken set: its first row is global index 10.
    const firstRow = required(container.querySelector('tbody tr'), 'the first body row');
    await fireEvent.click(firstRow);
    expect(bodyNames(container)[0]).toBe('Item 11');
    expect(clicked).toEqual([[10, 10]]);
  });

  it('keeps the page-size selector owning the size in client mode', async () => {
    const { container, getAllByRole, getByRole } = render(Table, {
      props: { columns, rows: makeRows(23), pagination: { pageSize: 5 } }
    });
    expect(rangeText(container)).toBe('1-5 of 23');

    await fireEvent.click(getByRole('combobox'));
    await fireEvent.click(
      required(
        getAllByRole('option').find((option) => option.textContent?.trim() === '10') ?? null,
        'the page-size option 10'
      )
    );

    expect(rangeText(container)).toBe('1-10 of 23');
  });
});

describe('Table server pagination leaves page ownership with the consumer', () => {
  const serverProps = {
    columns,
    rows: makeRows(5, 'Record').slice(0, 5),
    pagination: {
      mode: 'server' as const,
      page: 2,
      pageSize: 5,
      totalItems: 12
    }
  };

  it('treats a stepper click as a request and renders nothing until it is answered', async () => {
    const onPageChange = vi.fn();
    const { container, getByRole } = render(Table, {
      props: {
        ...serverProps,
        pagination: { ...serverProps.pagination, onPageChange }
      }
    });
    expect(rangeText(container)).toBe('6-10 of 12');

    await fireEvent.click(getByRole('button', { name: 'Page 3' }));

    // Refused: the consumer simply does not change `page`.
    expect(onPageChange.mock.calls).toEqual([[3]]);
    expect(rangeText(container)).toBe('6-10 of 12');
    expect(bodyNames(container)[0]).toBe('Record 01');
  });

  it('follows a delayed acceptance of that page', async () => {
    const onPageChange = vi.fn();
    const { container, getByRole, rerender } = render(Table, {
      props: {
        ...serverProps,
        pagination: { ...serverProps.pagination, onPageChange }
      }
    });

    await fireEvent.click(getByRole('button', { name: 'Page 3' }));
    // The fetch resolves later and the consumer swaps both halves at once.
    await rerender({
      rows: makeRows(2, 'Late'),
      pagination: { ...serverProps.pagination, page: 3, onPageChange }
    });

    expect(rangeText(container)).toBe('11-12 of 12');
    expect(bodyNames(container)).toEqual(['Late 01', 'Late 02']);
  });

  it('a declared pageSize stays authoritative when a size change is refused', async () => {
    const onPageSizeChange = vi.fn();
    const { container, getAllByRole, getByRole, rerender } = render(Table, {
      props: {
        ...serverProps,
        pagination: { ...serverProps.pagination, pageSizeOptions: [5, 10], onPageSizeChange }
      }
    });

    await fireEvent.click(getByRole('combobox'));
    await fireEvent.click(
      required(
        getAllByRole('option').find((option) => option.textContent?.trim() === '10') ?? null,
        'the page-size option 10'
      )
    );

    expect(onPageSizeChange.mock.calls).toEqual([[10]]);
    // Refused: the server is still serving pages of 5, so the chrome must not
    // start claiming pages of 10 rows that were never fetched.
    expect(rangeText(container)).toBe('6-10 of 12');

    await rerender({
      pagination: {
        ...serverProps.pagination,
        page: 1,
        pageSize: 10,
        pageSizeOptions: [5, 10],
        onPageSizeChange
      }
    });
    expect(rangeText(container)).toBe('1-10 of 12');
  });

  it('leaves the selector owning the size when the consumer declares none', async () => {
    const onPageSizeChange = vi.fn();
    const { container, getAllByRole, getByRole } = render(Table, {
      props: {
        columns,
        rows: makeRows(10, 'Record'),
        pagination: {
          mode: 'server' as const,
          page: 1,
          totalItems: 40,
          pageSizeOptions: [10, 25],
          onPageSizeChange
        }
      }
    });
    expect(rangeText(container)).toBe('1-10 of 40');

    await fireEvent.click(getByRole('combobox'));
    await fireEvent.click(
      required(
        getAllByRole('option').find((option) => option.textContent?.trim() === '25') ?? null,
        'the page-size option 25'
      )
    );

    // Unchanged pre-existing behaviour: with no declared pageSize the built-in
    // selector still drives the chrome on its own.
    expect(onPageSizeChange.mock.calls).toEqual([[25]]);
    expect(rangeText(container)).toBe('1-25 of 40');
  });

  it('never slices an already-fetched page, whatever the page number says', () => {
    const { container } = render(Table, {
      props: {
        columns,
        rows: makeRows(5, 'Record'),
        pagination: { mode: 'server' as const, page: 7, pageSize: 2, totalItems: 14 }
      }
    });

    // pageSize 2 would have sliced a client-mode table down to two rows.
    expect(bodyNames(container)).toEqual([
      'Record 01',
      'Record 02',
      'Record 03',
      'Record 04',
      'Record 05'
    ]);
  });
});
