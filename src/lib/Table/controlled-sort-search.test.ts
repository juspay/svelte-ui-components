import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Table from './Table.svelte';
import type { TableColumn, TableRow, TableSortState } from './properties';

/**
 * `sortMode="server"` already suppressed the internal
 * reorder, but sort state itself stayed private: `sortColumn`/`sortDirection`
 * were internal `$state` addressed by column INDEX, so a consumer could neither
 * restore a sort held in a URL nor keep one pointed at the same field when the
 * visible columns changed. These exercise the sort and search contracts through
 * the rendered table, not through re-implementations of its expressions.
 */

// The header filter Menu and the paginator's Select observe their panels with
// ResizeObserver, and Table's own scroll-affordance action observes the scroll
// container; jsdom implements none of it.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

const columns: TableColumn[] = [
  { id: 'name', label: 'Name' },
  { id: 'score', label: 'Score' }
];

const rows: TableRow[] = [
  { name: 'Bob', score: 20 },
  { name: 'Alice', score: 30 },
  { name: 'Carol', score: 10 }
];

/** Visible text of one body column, in render order. */
const columnText = (container: HTMLElement, colIndex: number): string[] =>
  [...container.querySelectorAll('tbody tr')].map((row) =>
    (row.querySelectorAll('td')[colIndex]?.textContent ?? '').trim()
  );

/** `aria-sort` of every header cell, in render order (null when absent). */
const headerSortStates = (container: HTMLElement): Array<string | null> =>
  [...container.querySelectorAll('th')].map((header) => header.getAttribute('aria-sort'));

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

describe('Table controlled sort (keyed by column ID)', () => {
  it('restores an initial descending sort into the built-in header', () => {
    const { container } = render(Table, {
      props: { columns, rows, sortState: { columnId: 'name', direction: 'desc' } }
    });

    expect(columnText(container, 0)).toEqual(['Carol', 'Bob', 'Alice']);
    expect(headerSortStates(container)).toEqual(['descending', 'none']);
  });

  it('clears the sort when the consumer sets the state to null', async () => {
    const { container, rerender } = render(Table, {
      props: { columns, rows, sortState: { columnId: 'name', direction: 'desc' } }
    });
    expect(columnText(container, 0)).toEqual(['Carol', 'Bob', 'Alice']);

    // `null` is a controlled value: sorted by nothing, and still controlled —
    // it must not fall back to whatever an internal state last held.
    await rerender({ sortState: null });

    expect(columnText(container, 0)).toEqual(['Bob', 'Alice', 'Carol']);
    expect(headerSortStates(container)).toEqual(['none', 'none']);
  });

  it('follows an external update to another column and direction', async () => {
    const { container, rerender } = render(Table, {
      props: { columns, rows, sortState: { columnId: 'name', direction: 'desc' } }
    });

    await rerender({ sortState: { columnId: 'score', direction: 'asc' } });

    expect(columnText(container, 0)).toEqual(['Carol', 'Bob', 'Alice']);
    expect(columnText(container, 1)).toEqual(['10', '20', '30']);
    expect(headerSortStates(container)).toEqual(['none', 'ascending']);
  });

  it('keeps the sort on the same FIELD when columns are reordered', async () => {
    const { container, rerender } = render(Table, {
      props: { columns, rows, sortState: { columnId: 'score', direction: 'asc' } }
    });
    expect(headerSortStates(container)).toEqual(['none', 'ascending']);

    // Score moves to index 0. An index-keyed contract would now sort by Name.
    await rerender({ columns: [columns[1], columns[0]] });

    expect(columnText(container, 0)).toEqual(['10', '20', '30']);
    expect(columnText(container, 1)).toEqual(['Carol', 'Bob', 'Alice']);
    expect(headerSortStates(container)).toEqual(['ascending', 'none']);
  });

  it('sorts nothing when the sorted column is hidden, rather than sorting its replacement', async () => {
    const { container, rerender } = render(Table, {
      props: { columns, rows, sortState: { columnId: 'score', direction: 'asc' } }
    });

    await rerender({ columns: [columns[0]] });

    // Not "ascending by Name" — the sorted field is simply not on screen.
    expect(columnText(container, 0)).toEqual(['Bob', 'Alice', 'Carol']);
    expect(headerSortStates(container)).toEqual(['none']);
  });

  it('never mutates a controlled sort: a header click only reports', async () => {
    const onsort = vi.fn();
    const onsortchange = vi.fn();
    const { container, getByRole } = render(Table, {
      props: {
        columns,
        rows,
        sortState: { columnId: 'name', direction: 'desc' },
        onsort,
        onsortchange
      }
    });

    await fireEvent.click(getByRole('button', { name: 'Sort by Score' }));

    expect(onsort.mock.calls).toEqual([[1, 'asc']]);
    expect(onsortchange.mock.calls).toEqual([[{ columnId: 'score', direction: 'asc' }]]);
    // The consumer has not answered yet, so nothing moved.
    expect(columnText(container, 0)).toEqual(['Carol', 'Bob', 'Alice']);
    expect(headerSortStates(container)).toEqual(['descending', 'none']);
  });

  it('reports the same ascending/descending cycle a controlled consumer feeds back', async () => {
    const reported: TableSortState[] = [];
    let sortState: TableSortState | null = null;
    const { container, getByRole, rerender } = render(Table, {
      props: {
        columns,
        rows,
        sortState,
        onsortchange: (next: TableSortState) => {
          reported.push(next);
          sortState = next;
        }
      }
    });

    const nameButton = getByRole('button', { name: 'Sort by Name' });
    await fireEvent.click(nameButton);
    await rerender({ sortState });
    expect(columnText(container, 0)).toEqual(['Alice', 'Bob', 'Carol']);

    await fireEvent.click(nameButton);
    await rerender({ sortState });
    expect(columnText(container, 0)).toEqual(['Carol', 'Bob', 'Alice']);

    expect(reported).toEqual([
      { columnId: 'name', direction: 'asc' },
      { columnId: 'name', direction: 'desc' }
    ]);
  });

  it('server mode never re-sorts an already-fetched page locally', async () => {
    const onsort = vi.fn();
    const { container, getByRole } = render(Table, {
      props: {
        columns,
        rows,
        sortMode: 'server',
        sortState: { columnId: 'score', direction: 'desc' },
        onsort
      }
    });

    // The header announces the server's sort; the rows keep the server's order.
    expect(headerSortStates(container)).toEqual(['none', 'descending']);
    expect(columnText(container, 0)).toEqual(['Bob', 'Alice', 'Carol']);

    await fireEvent.click(getByRole('button', { name: 'Sort by Name' }));

    expect(onsort.mock.calls).toEqual([[0, 'asc']]);
    expect(columnText(container, 0)).toEqual(['Bob', 'Alice', 'Carol']);
  });

  it('addresses positional columns by their index string', () => {
    const { container } = render(Table, {
      props: {
        tableHeaders: ['Name', 'Score'],
        tableData: [
          ['Bob', 20],
          ['Alice', 30],
          ['Carol', 10]
        ],
        sortState: { columnId: '1', direction: 'desc' }
      }
    });

    expect(columnText(container, 1)).toEqual(['30', '20', '10']);
    expect(headerSortStates(container)).toEqual(['none', 'descending']);
  });
});

describe('Table uncontrolled sort is unchanged', () => {
  it('cycles ascending then descending on click and reports the column index', async () => {
    const onsort = vi.fn();
    const { container, getByRole } = render(Table, { props: { columns, rows, onsort } });

    expect(headerSortStates(container)).toEqual(['none', 'none']);

    const scoreButton = getByRole('button', { name: 'Sort by Score' });
    await fireEvent.click(scoreButton);
    expect(columnText(container, 1)).toEqual(['10', '20', '30']);
    expect(headerSortStates(container)).toEqual(['none', 'ascending']);

    await fireEvent.click(scoreButton);
    expect(columnText(container, 1)).toEqual(['30', '20', '10']);
    expect(headerSortStates(container)).toEqual(['none', 'descending']);

    // A different column starts at ascending again.
    await fireEvent.click(getByRole('button', { name: 'Sort by Name' }));
    expect(columnText(container, 0)).toEqual(['Alice', 'Bob', 'Carol']);
    expect(onsort.mock.calls).toEqual([
      [1, 'asc'],
      [1, 'desc'],
      [0, 'asc']
    ]);
  });

  it('keeps an uncontrolled sort on its field when columns are reordered', async () => {
    const { container, getByRole, rerender } = render(Table, { props: { columns, rows } });

    await fireEvent.click(getByRole('button', { name: 'Sort by Score' }));
    await rerender({ columns: [columns[1], columns[0]] });

    // The sort was made on Score at index 1 and Score is now index 0.
    expect(columnText(container, 0)).toEqual(['10', '20', '30']);
    expect(headerSortStates(container)).toEqual(['ascending', 'none']);
  });
});

describe('Table controlled search term', () => {
  const searchRows: TableRow[] = [
    { name: 'Alpha', score: 1 },
    { name: 'Beta', score: 2 },
    { name: 'Gamma', score: 3 }
  ];

  it('renders the consumer term and still filters client-side', () => {
    const { container } = render(Table, {
      props: {
        columns,
        rows: searchRows,
        searchConfig: { testId: 'search', searchTerm: 'Bet' }
      }
    });

    expect(container.querySelector<HTMLInputElement>('.table-search-input')?.value).toBe('Bet');
    expect(columnText(container, 0)).toEqual(['Beta']);
  });

  it('reports a typed term without adopting it', async () => {
    const onSearchTermChange = vi.fn();
    const { container } = render(Table, {
      props: {
        columns,
        rows: searchRows,
        searchConfig: { searchTerm: 'Bet', onSearchTermChange }
      }
    });

    const input = required(
      container.querySelector<HTMLInputElement>('.table-search-input'),
      'the search input'
    );
    await fireEvent.input(input, { target: { value: 'Gam' } });

    expect(onSearchTermChange.mock.calls).toEqual([['Gam']]);
    // Still filtered by the consumer's term: Table never wrote to it.
    expect(columnText(container, 0)).toEqual(['Beta']);
  });

  it('follows an external update to the term', async () => {
    const { container, rerender } = render(Table, {
      props: { columns, rows: searchRows, searchConfig: { searchTerm: 'Bet' } }
    });

    await rerender({ searchConfig: { searchTerm: 'Gam' } });

    expect(container.querySelector<HTMLInputElement>('.table-search-input')?.value).toBe('Gam');
    expect(columnText(container, 0)).toEqual(['Gamma']);
  });

  it('leaves the uncontrolled search owning its own term', async () => {
    const onSearchTermChange = vi.fn();
    const { container } = render(Table, {
      props: { columns, rows: searchRows, searchConfig: { onSearchTermChange } }
    });

    const input = required(
      container.querySelector<HTMLInputElement>('.table-search-input'),
      'the search input'
    );
    await fireEvent.input(input, { target: { value: 'Gam' } });

    expect(columnText(container, 0)).toEqual(['Gamma']);
    expect(onSearchTermChange.mock.calls).toEqual([['Gam']]);
  });

  it('keeps onsearchchange delegating the FILTERING, controlled term or not', async () => {
    const onsearchchange = vi.fn();
    const { container } = render(Table, {
      props: {
        columns,
        rows: searchRows,
        searchConfig: { searchTerm: 'Bet' },
        onsearchchange
      }
    });

    // Server search: the consumer's rows pass through unfiltered even though
    // the visible term would have matched exactly one of them locally.
    expect(columnText(container, 0)).toEqual(['Alpha', 'Beta', 'Gamma']);

    const input = required(
      container.querySelector<HTMLInputElement>('.table-search-input'),
      'the search input'
    );
    await fireEvent.input(input, { target: { value: 'Gam' } });
    expect(onsearchchange.mock.calls).toEqual([['Gam']]);
  });
});
