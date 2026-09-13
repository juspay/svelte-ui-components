import { render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Table from './Table.svelte';
import type { TableColumn, TableRow } from './properties';

/**
 * Mobile record cards.
 *
 * `mobileCardLayout` is off by default, so these first cover that the prop is
 * truly inert until asked for — a stacked-card layout changing every existing
 * consumer's table at some viewport width, with no opt-in, would be a breaking
 * change to a published library.
 *
 * Once on, the accessibility contract is what the rest of the file pins: a
 * `td::before { content: attr(data-label) }` recipe was ruled out because
 * generated content cannot carry `aria-hidden`, and cannot exist at all for a
 * `<sui-table>` consumer whose stylesheet cannot reach inside the shadow root.
 * Table instead renders a real `<span class="table-mobile-label">` — present
 * in the DOM, `aria-hidden="true"` so it does not double-announce alongside
 * the `role="columnheader"`/`role="cell"` association restated below — and
 * that pairing is exactly what these tests assert. `Table.svelte`'s `<style>`
 * is what actually turns `display: table-cell` into `display: block` (jsdom
 * does not run layout), so this file is deliberately about markup/DOM and
 * roles, not about pixels — the visual side is the browser/visual suite's job.
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

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Table mobileCardLayout — off by default', () => {
  it('adds no roles and renders no label spans when the prop is absent', () => {
    const { container } = render(Table, { props: { columns, rows } });

    expect(container.querySelector('table')?.hasAttribute('role')).toBe(false);
    expect(container.querySelector('thead')?.hasAttribute('role')).toBe(false);
    expect(container.querySelector('tbody')?.hasAttribute('role')).toBe(false);
    expect(container.querySelectorAll('[role]')).toHaveLength(0);
    expect(container.querySelector('.table-mobile-label')).toBeNull();
    expect(
      container.querySelector('.table-container')?.classList.contains('table-mobile-cards')
    ).toBe(false);
  });

  it('stays inert even when explicitly set to false', () => {
    const { container } = render(Table, {
      props: { columns, rows, mobileCardLayout: false }
    });

    expect(container.querySelectorAll('[role]')).toHaveLength(0);
    expect(container.querySelector('.table-mobile-label')).toBeNull();
  });
});

describe('Table mobileCardLayout — on, keyed columns model', () => {
  it('marks the container and restates table semantics that display:block would drop', () => {
    const { container } = render(Table, {
      props: { columns, rows, mobileCardLayout: true }
    });

    expect(
      container.querySelector('.table-container')?.classList.contains('table-mobile-cards')
    ).toBe(true);
    expect(container.querySelector('table')?.getAttribute('role')).toBe('table');
    expect(container.querySelector('thead')?.getAttribute('role')).toBe('rowgroup');
    expect(container.querySelector('tbody')?.getAttribute('role')).toBe('rowgroup');
    expect(container.querySelectorAll('thead tr')[0]?.getAttribute('role')).toBe('row');
    expect(
      [...container.querySelectorAll('thead th')].every(
        (th) => th.getAttribute('role') === 'columnheader'
      )
    ).toBe(true);
    const bodyRows = [...container.querySelectorAll('tbody tr')];
    expect(bodyRows.every((tr) => tr.getAttribute('role') === 'row')).toBe(true);
    expect(
      [...container.querySelectorAll('tbody td')].every((td) => td.getAttribute('role') === 'cell')
    ).toBe(true);
  });

  it('renders one aria-hidden label per data cell, matching that column header', () => {
    const { container } = render(Table, {
      props: { columns, rows, mobileCardLayout: true }
    });

    const firstRow = container.querySelectorAll('tbody tr')[0];
    const labels = [...firstRow.querySelectorAll('.table-mobile-label')];
    expect(labels.map((label) => label.textContent)).toEqual(['Name', 'Team']);
    expect(labels.every((label) => label.getAttribute('aria-hidden') === 'true')).toBe(true);

    // The label sits inside the same <td> the columnheader-restated role marks
    // as a cell — a screen reader that still associates header text by DOM
    // structure gets the real header, not just this visible duplicate.
    for (const label of labels) {
      const cell = label.closest('td');
      expect(cell?.getAttribute('role')).toBe('cell');
    }
  });

  it('labels the checkbox column "Select" and the row-number column with rowNumberLabel', () => {
    const { container } = render(Table, {
      props: {
        columns,
        rows,
        mobileCardLayout: true,
        rowNumberColumn: true,
        rowNumberLabel: '№',
        checkboxSelection: { enabled: true }
      }
    });

    const firstRow = container.querySelectorAll('tbody tr')[0];
    const labels = [...firstRow.querySelectorAll('.table-mobile-label')].map(
      (el) => el.textContent
    );
    expect(labels).toEqual(['Select', '№', 'Name', 'Team']);
  });
});

describe('Table mobileCardLayout — on, positional headers/data model', () => {
  it('labels each cell from tableHeaders, identically to the keyed model', () => {
    const { container } = render(Table, {
      props: {
        tableHeaders: ['Name', 'Team'],
        tableData: [
          ['Alice', 'Platform'],
          ['Bob', 'Design']
        ],
        mobileCardLayout: true
      }
    });

    expect(container.querySelector('table')?.getAttribute('role')).toBe('table');
    const rowsOut = [...container.querySelectorAll('tbody tr')];
    for (const row of rowsOut) {
      const labels = [...row.querySelectorAll('.table-mobile-label')].map((el) => el.textContent);
      expect(labels).toEqual(['Name', 'Team']);
    }
  });
});
