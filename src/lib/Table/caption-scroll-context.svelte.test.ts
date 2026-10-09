import { render, waitFor, within } from '@testing-library/svelte';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import Table from './Table.svelte';

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
});

const data = { tableHeaders: ['Plan', 'State'], tableData: [['Growth', 'Monthly']] };
const wrappers = (container: HTMLElement) => [
  container.querySelector('.table-container'),
  container.querySelector('.table-scroll')
];

describe('Table caption at keyboard scroll targets', () => {
  it('preserves unnamed generic wrappers for omitted and explicit empty caption', async () => {
    const { container, rerender } = render(Table, data);
    for (const node of wrappers(container)) {
      expect(node?.hasAttribute('role')).toBe(false);
      expect(node?.hasAttribute('aria-label')).toBe(false);
      expect(node?.hasAttribute('tabindex')).toBe(false);
    }
    await rerender({ ...data, caption: '' });
    expect(container.querySelector('caption')).toBeNull();
    for (const node of wrappers(container)) {
      expect(node?.hasAttribute('role')).toBe(false);
      expect(node?.hasAttribute('aria-label')).toBe(false);
    }
  });

  it('updates localized and escaped caption identity without replacing native table content', async () => {
    const { container, rerender } = render(Table, {
      ...data,
      caption: 'Plans "<review>" & totals'
    });
    const table = within(container).getByRole('table', { name: 'Plans "<review>" & totals' });
    expect(container.querySelector('caption')?.classList.contains('sr-only')).toBe(true);
    expect(within(table).getByRole('columnheader', { name: 'Plan' })).toBeTruthy();
    expect(within(table).getByRole('cell', { name: 'Growth' })).toBeTruthy();
    const inner = container.querySelector('.table-scroll');
    expect(inner?.getAttribute('role')).toBe('group');
    expect(inner?.getAttribute('aria-label')).toBe('Plans "<review>" & totals');
    // jsdom has no overflowing layout: actual vertical-owner naming is covered
    // by real browser resize tests, without fabricating geometry in this suite.
    expect(container.querySelector('.table-container')?.hasAttribute('role')).toBe(false);
    expect(container.querySelector('review, script')).toBeNull();
    await rerender({ ...data, caption: 'Comparatif des abonnements' });
    await waitFor(() => {
      expect(inner?.getAttribute('aria-label')).toBe('Comparatif des abonnements');
    });
    expect(within(container).getByRole('table', { name: 'Comparatif des abonnements' })).toBe(
      table
    );
    await rerender({ ...data, caption: '' });
    for (const node of wrappers(container)) {
      expect(node?.hasAttribute('role')).toBe(false);
      expect(node?.hasAttribute('aria-label')).toBe(false);
    }
  });

  it('preserves clickable rows and mobile table roles inside named scroll context', () => {
    const { container, getByRole } = render(Table, {
      ...data,
      caption: 'Subscription plan details',
      isTableScrollable: true,
      mobileCardLayout: true,
      onrowclick: vi.fn()
    });
    expect(
      within(container).getAllByRole('group', { name: 'Subscription plan details' })
    ).toHaveLength(1);
    expect(getByRole('table', { name: 'Subscription plan details' }).getAttribute('role')).toBe(
      'table'
    );
    const row = getByRole('row', { name: 'Growth' });
    expect(row.getAttribute('role')).toBe('row');
    expect(row.getAttribute('tabindex')).toBe('0');
    expect(within(row).getByRole('cell', { name: 'Growth' })).toBeTruthy();
    for (const node of wrappers(container)) {
      expect(node?.hasAttribute('tabindex')).toBe(false);
    }
  });
});
