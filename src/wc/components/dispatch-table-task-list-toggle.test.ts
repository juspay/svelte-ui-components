import { beforeAll, afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import './Table.wc.svelte';
import './TaskList.wc.svelte';
import './Toggle.wc.svelte';

/**
 * Proof for Table.wc.svelte, TaskList.wc.svelte, and Toggle.wc.svelte: mounts the
 * real custom elements (not a stand-in) for three wrappers -- Table (the
 * 3-/2-argument CALLBACK_ARGUMENT_NAMES cases added to ../dispatch.ts), TaskList (a
 * plain 1-argument case), and Toggle (a formAssociated/`extend` collision case,
 * proving the "KNOWN TRAP" prototype-chain comment on that wrapper is not just
 * asserted but true at runtime). Same shape as dispatch-integration.test.ts's own
 * additions: set/don't set a JS callback, attach addEventListener, interact for
 * real, assert both fire.
 */

beforeAll(() => {
  // Table.svelte's trackHorizontalScroll observes scroll-hint width changes via
  // ResizeObserver, which jsdom does not implement (same stub shape as
  // dispatch-integration.test.ts's BarChart/ChartContainer case and
  // src/lib/_chart/consumer-adapters.test.ts).
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }
  );
  // Toggle is form-associated (src/wc/form-associated.ts), which calls
  // internals.setFormValue()/setValidity() on every click -- jsdom's
  // ElementInternals implements neither (confirmed empirically in
  // dispatch-integration.test.ts's own beforeAll). Same stub, needed again here because
  // each test file gets its own module/global state.
  Object.defineProperty(ElementInternals.prototype, 'setFormValue', {
    value: () => {},
    writable: true,
    configurable: true
  });
  Object.defineProperty(ElementInternals.prototype, 'setValidity', {
    value: () => {},
    writable: true,
    configurable: true
  });
});
afterAll(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

const mounted: HTMLElement[] = [];
function mount(tag: string): HTMLElement {
  const el = document.createElement(tag);
  document.body.appendChild(el);
  mounted.push(el);
  return el;
}
afterEach(() => {
  for (const el of mounted.splice(0)) {
    el.remove();
  }
});

describe('Table.wc.svelte (onrowclick, 3 arguments, non-colliding)', () => {
  it("bundles detail as { rowIndex, rowData, originalIndex } -- Table/properties.ts's own onrowclick parameter names -- and still calls a set callback", async () => {
    const el = mount('sui-table');
    const original = vi.fn();
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.onrowclick = original;
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.tableHeaders = ['Name'];
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.tableData = [['Alice']];
    await tick();

    let detail: unknown;
    let fired = 0;
    el.addEventListener('rowclick', (e) => {
      fired += 1;
      detail = (e as CustomEvent).detail;
    });

    const row = el.shadowRoot?.querySelector('tr.table-row');
    expect(row).not.toBeNull();
    row?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(fired).toBe(1);
    expect(detail).toEqual({ rowIndex: 0, rowData: ['Alice'], originalIndex: 0 });
    expect(original).toHaveBeenCalledTimes(1);
    expect(original).toHaveBeenCalledWith(0, ['Alice'], 0);
  });

  it('leaves rows non-interactive, and dispatches nothing, until onrowclick is set', async () => {
    // This asserted the reverse, and its comment stated the defect as the rule:
    // "dispatchEvents always returns a wrapper function for a non-colliding prop
    // regardless of whether a consumer callback was ever assigned -- so the row must
    // still be clickable here". Table gates `isRowClickable` on
    // `typeof onrowclick === 'function'`, so an unconditional dispatcher made every
    // row of every <sui-table> interactive for a consumer who wired nothing: a
    // pointer cursor and a click target with nothing behind it. `onrowclick` is now
    // presence-gated (presence-gated-callbacks.ts).
    const el = mount('sui-table');
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.tableHeaders = ['Name'];
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.tableData = [['Alice']];
    await tick();

    let fired = 0;
    el.addEventListener('rowclick', () => {
      fired += 1;
    });

    const row = el.shadowRoot?.querySelector('tr.table-row');
    expect(row).not.toBeNull();
    row?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fired).toBe(0);

    // Assigned after mount: $derived re-reads props, so the row becomes clickable and
    // the event fires alongside the consumer's own callback.
    const onrowclick = vi.fn();
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.onrowclick = onrowclick;
    await tick();

    el.shadowRoot
      ?.querySelector('tr.table-row')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fired).toBe(1);
    expect(onrowclick).toHaveBeenCalledWith(0, ['Alice'], 0);
  });

  it('bundles onsort detail as { columnIndex, direction } and still calls a set callback', async () => {
    const el = mount('sui-table');
    const original = vi.fn();
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.onsort = original;
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.tableHeaders = ['Name'];
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.tableData = [['Alice'], ['Bob']];
    await tick();

    let detail: unknown;
    let fired = 0;
    el.addEventListener('sort', (e) => {
      fired += 1;
      detail = (e as CustomEvent).detail;
    });

    const sortButton = el.shadowRoot?.querySelector('.sort-button button');
    expect(sortButton).not.toBeNull();
    sortButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(fired).toBe(1);
    expect(detail).toEqual({ columnIndex: 0, direction: 'asc' });
    expect(original).toHaveBeenCalledTimes(1);
    expect(original).toHaveBeenCalledWith(0, 'asc');
  });
});

describe('TaskList.wc.svelte (onretry, 1 argument, non-colliding)', () => {
  it('dispatches retry with the row index as detail, and still calls a set callback', async () => {
    const el = mount('sui-task-list');
    const original = vi.fn();
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.onretry = original;
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.rows = [{ label: 'Build', status: 'failed', retryLabel: 'Retry' }];
    await tick();

    let detail: unknown;
    let fired = 0;
    el.addEventListener('retry', (e) => {
      fired += 1;
      detail = (e as CustomEvent).detail;
    });

    const retryButton = el.shadowRoot?.querySelector('.row-retry button');
    expect(retryButton).not.toBeNull();
    retryButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(fired).toBe(1);
    expect(detail).toBe(0);
    expect(original).toHaveBeenCalledTimes(1);
    expect(original).toHaveBeenCalledWith(0);
  });

  it('dispatches retry even when the consumer never sets onretry at all', async () => {
    const el = mount('sui-task-list');
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.rows = [{ label: 'Build', status: 'failed', retryLabel: 'Retry' }];
    await tick();

    let fired = 0;
    el.addEventListener('retry', () => {
      fired += 1;
    });

    const retryButton = el.shadowRoot?.querySelector('.row-retry button');
    retryButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(fired).toBe(1);
  });
});

describe('Toggle.wc.svelte (onclick collides -- must dispatch NOTHING)', () => {
  it("calls the consumer's onclick with the new checked value, and never dispatches a synthetic click", async () => {
    const el = mount('sui-toggle');
    const original = vi.fn();
    // @ts-expect-error -- declared custom-element prop, typed (checked: boolean) => void,
    // not the native MouseEvent-taking onclick HTMLElement declares.
    el.onclick = original;
    // @ts-expect-error -- declared custom-element prop, not typed on HTMLElement
    el.testId = 'tg';
    await tick();

    let fired = 0;
    el.addEventListener('click', () => {
      fired += 1;
    });

    const input = el.shadowRoot?.querySelector('input');
    expect(input).not.toBeNull();
    // bubbles + composed: a real click on shadow content crosses the shadow
    // boundary on its own, with no help from dispatch.ts.
    input?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));

    // Exactly one -- the real, natively-bubbled click. If dispatchEvents had
    // (wrongly) treated onclick as non-colliding, this would be 2.
    expect(fired).toBe(1);
    expect(original).toHaveBeenCalledTimes(1);
    expect(original).toHaveBeenCalledWith(true);
  });
});
