import { render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Table from './Table.svelte';
import type { TableColumn, TablePaginationConfig, TableRow } from './properties';

/**
 * The built-in paginator's page-size selector is an ARIA combobox, and a
 * combobox takes no name from the value it displays, so before `labels.rowsPerPage`
 * it was announced as an unnamed combobox. Consumers worked around it by stamping
 * an aria-label onto every `.table-paginator-size [role="combobox"]` they could
 * find; the name now belongs to Table, where the other generated names already are.
 *
 * Mounted rather than driven through the demo route for the same reason as
 * labels.svelte.test.ts: the assertion is about a generated name, which needs no
 * page, and a demo section would move that route's visual baseline.
 */

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

const columns: TableColumn[] = [{ id: 'name', label: 'Name' }];

const rows: TableRow[] = Array.from({ length: 12 }, (_unused, index) => ({
  name: `Item ${String(index + 1).padStart(2, '0')}`
}));

const pagination: TablePaginationConfig = { pageSize: 5 };

const pageSizeTrigger = (container: HTMLElement): HTMLElement | null =>
  container.querySelector<HTMLElement>('.table-paginator-size [role="combobox"]');

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Table page-size selector accessible name', () => {
  it('names the combobox "Rows per page" when no labels are given', () => {
    const { container, getByRole } = render(Table, { props: { columns, rows, pagination } });

    const trigger = getByRole('combobox', { name: 'Rows per page' });
    expect(trigger).toBe(pageSizeTrigger(container));
  });

  it('uses labels.rowsPerPage and drops the English default on that instance', () => {
    const { getByRole, queryByRole } = render(Table, {
      props: { columns, rows, pagination, labels: { rowsPerPage: 'Lignes par page' } }
    });

    expect(getByRole('combobox', { name: 'Lignes par page' })).toBeTruthy();
    expect(queryByRole('combobox', { name: 'Rows per page' })).toBeNull();
  });

  it('falls back per member, so translating another label keeps this one in English', () => {
    const { getByRole } = render(Table, {
      props: {
        columns,
        rows,
        pagination,
        labels: { sortBy: (header) => `Trier par ${header}` }
      }
    });

    expect(getByRole('combobox', { name: 'Rows per page' })).toBeTruthy();
    expect(getByRole('button', { name: 'Trier par Name' })).toBeTruthy();
  });

  it('follows labels as they change and returns to English when they are cleared', async () => {
    const { container, rerender } = render(Table, { props: { columns, rows, pagination } });
    const trigger = pageSizeTrigger(container);

    expect(trigger?.getAttribute('aria-label')).toBe('Rows per page');

    await rerender({ labels: { rowsPerPage: 'Rows' } });
    expect(trigger?.getAttribute('aria-label')).toBe('Rows');

    await rerender({ labels: void 0 });
    expect(trigger?.getAttribute('aria-label')).toBe('Rows per page');
  });

  it('keeps the name while the paginator is loading', () => {
    const { getByRole } = render(Table, {
      props: { columns, rows, pagination: { ...pagination, isLoading: true } }
    });

    expect(getByRole('combobox', { name: 'Rows per page' })).toBeTruthy();
  });

  // A suppressed selector renders nothing for the fix to name, so these pass with
  // or without it. They guard the other direction: the name must not turn up on
  // some other element, and the paginator must still be there for that to mean
  // anything.
  it.each([{ pageSizeOptions: [] }, { hidePageSizeSelector: true }])(
    'puts the name nowhere else when the selector is not rendered (%j)',
    (hidingOption) => {
      const { getByRole, queryByLabelText, queryByRole } = render(Table, {
        props: { columns, rows, pagination: { ...pagination, ...hidingOption } }
      });

      expect(getByRole('button', { name: 'Next page' })).toBeTruthy();
      expect(queryByRole('combobox')).toBeNull();
      expect(queryByLabelText('Rows per page')).toBeNull();
    }
  );

  it('leaves every other paginator control named alongside the selector', () => {
    const { getByRole } = render(Table, { props: { columns, rows, pagination } });

    expect(getByRole('combobox', { name: 'Rows per page' })).toBeTruthy();
    expect(getByRole('button', { name: 'Previous page' })).toBeTruthy();
    expect(getByRole('button', { name: 'Page 1' })).toBeTruthy();
    expect(getByRole('button', { name: 'Next page' })).toBeTruthy();
  });
});
