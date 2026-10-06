import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { describeBlocks, scrollRegions, syncScrollRegions } from './_scroll-regions';

// jsdom does no layout, so scrollWidth and clientWidth are both 0. Each block's
// overflow is stated explicitly instead, which is exactly the input the module
// reads. The real-browser behaviour (WebKit Tab reach, resize, font changes) is
// covered in tests/docs-code-block-access.spec.ts.
const setBox = (el: HTMLElement, scrollWidth: number, clientWidth: number): void => {
  Object.defineProperty(el, 'scrollWidth', { configurable: true, value: scrollWidth });
  Object.defineProperty(el, 'clientWidth', { configurable: true, value: clientWidth });
};

const mountDocs = (html: string): HTMLElement => {
  const root = document.createElement('div');
  root.className = 'markdown-body';
  root.innerHTML = html;
  document.body.append(root);
  return root;
};

const DOCS_ONLY = { context: 'Card', demoRows: false } as const;

const pres = (root: HTMLElement): HTMLElement[] => [...root.querySelectorAll('pre')];

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe('describeBlocks', () => {
  it('names a block by its language and the heading above it', () => {
    const root = mountDocs(
      '<h2>Usage</h2><p>text</p><pre><code class="language-svelte">a</code></pre>'
    );
    const labels = describeBlocks(pres(root), root, 'Card');
    expect([...labels.values()]).toEqual(['Svelte code: Usage']);
  });

  it('numbers blocks that share a section, over all blocks rather than only the wide ones', () => {
    const root = mountDocs(
      '<h3>Examples</h3><pre><code class="language-ts">1</code></pre><pre><code class="language-ts">2</code></pre><pre><code class="language-svelte">3</code></pre>'
    );
    const labels = describeBlocks(pres(root), root, 'Card');
    expect([...labels.values()]).toEqual([
      'TypeScript code 1 of 2: Examples',
      'TypeScript code 2 of 2: Examples',
      'Svelte code: Examples'
    ]);
  });

  it('keeps labels unique when the same heading text repeats under different sections', () => {
    const root = mountDocs(
      '<h2>A</h2><h3>Example</h3><pre><code>x</code></pre><h2>B</h2><h3>Example</h3><pre><code>y</code></pre>'
    );
    const labels = [...describeBlocks(pres(root), root, 'Card').values()];
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels).toEqual(['Code 1 of 2: Example', 'Code 2 of 2: Example']);
  });

  it('falls back to the component name when no heading precedes the block', () => {
    const root = mountDocs('<pre><code>x</code></pre>');
    expect([...describeBlocks(pres(root), root, 'Card').values()]).toEqual([
      'Code: Card documentation'
    ]);
  });

  it('finds the heading above a block that sits inside a wrapper', () => {
    const root = mountDocs('<h2>Props</h2><ul><li><pre><code>x</code></pre></li></ul>');
    expect([...describeBlocks(pres(root), root, 'Card').values()]).toEqual(['Code: Props']);
  });

  it('labels a table wrapper as a table', () => {
    const root = mountDocs(
      '<h2>Props</h2><div class="docs-table-scroll"><table><tr><td>a</td></tr></table></div>'
    );
    const wrapper = root.querySelector<HTMLElement>('.docs-table-scroll');
    expect(wrapper).not.toBeNull();
    if (wrapper !== null) {
      expect(describeBlocks([wrapper], root, 'Card').get(wrapper)).toBe('Table: Props');
    }
  });
});

describe('syncScrollRegions', () => {
  it('makes only the overflowing block a focusable named region', () => {
    const root = mountDocs(
      '<h2>Usage</h2><pre id="wide"><code>w</code></pre><pre id="narrow"><code>n</code></pre>'
    );
    const [wide, narrow] = pres(root);
    setBox(wide, 900, 600);
    setBox(narrow, 600, 600);
    syncScrollRegions(root, DOCS_ONLY);

    expect(wide.getAttribute('tabindex')).toBe('0');
    expect(wide.getAttribute('role')).toBe('region');
    expect(wide.getAttribute('aria-label')).toBe('Code 1 of 2: Usage');
    expect(narrow.hasAttribute('tabindex')).toBe(false);
    expect(narrow.hasAttribute('role')).toBe(false);
    expect(narrow.hasAttribute('aria-label')).toBe(false);
  });

  it('removes the access again when the block stops overflowing', () => {
    const root = mountDocs('<h2>Usage</h2><pre><code>w</code></pre>');
    const [block] = pres(root);
    setBox(block, 900, 600);
    syncScrollRegions(root, DOCS_ONLY);
    expect(block.getAttribute('tabindex')).toBe('0');

    setBox(block, 600, 600);
    syncScrollRegions(root, DOCS_ONLY);
    expect(block.hasAttribute('tabindex')).toBe(false);
    expect(block.hasAttribute('role')).toBe(false);
    expect(block.hasAttribute('aria-label')).toBe(false);
  });

  it('never strips attributes that something else put on a block', () => {
    const root = mountDocs('<pre tabindex="-1" role="group" aria-label="Own"><code>x</code></pre>');
    const [block] = pres(root);
    setBox(block, 600, 600);
    syncScrollRegions(root, DOCS_ONLY);
    expect(block.getAttribute('tabindex')).toBe('-1');
    expect(block.getAttribute('role')).toBe('group');
    expect(block.getAttribute('aria-label')).toBe('Own');
  });
});

describe('demo rows (compact layout only)', () => {
  const mountDemo = (): { root: HTMLElement; rows: HTMLElement[] } => {
    const root = document.createElement('main');
    root.innerHTML =
      '<h2>Horizontal stepper</h2><div class="demo-row"><span>wide</span></div><h2>Fits</h2><div class="demo-row"><span>ok</span></div>';
    document.body.append(root);
    return { root, rows: [...root.querySelectorAll<HTMLElement>('.demo-row')] };
  };

  it('makes an overflowing row a named, focusable region in the compact layout', () => {
    const { root, rows } = mountDemo();
    setBox(rows[0], 700, 324);
    setBox(rows[1], 324, 324);
    syncScrollRegions(root, { context: 'Stepper', demoRows: true });

    expect(rows[0].getAttribute('tabindex')).toBe('0');
    expect(rows[0].getAttribute('role')).toBe('region');
    expect(rows[0].getAttribute('aria-label')).toBe('Example: Horizontal stepper');
    expect(rows[0].hasAttribute('data-scroll-region')).toBe(true);
    expect(rows[1].hasAttribute('tabindex')).toBe(false);
    expect(rows[1].hasAttribute('data-scroll-region')).toBe(false);
  });

  it('keeps authored radiogroup semantics before, during and after overflow', () => {
    const { root, rows } = mountDemo();
    rows[0].setAttribute('role', 'radiogroup');
    rows[0].setAttribute('aria-label', 'Shipping speed');
    setBox(rows[0], 700, 324);
    syncScrollRegions(root, { context: 'Choicebox', demoRows: true });
    expect(rows[0].getAttribute('role')).toBe('radiogroup');
    expect(rows[0].getAttribute('aria-label')).toBe('Shipping speed');
    expect(rows[0].getAttribute('tabindex')).toBe('0');
    setBox(rows[0], 324, 324);
    syncScrollRegions(root, { context: 'Choicebox', demoRows: true });
    expect(rows[0].getAttribute('role')).toBe('radiogroup');
    expect(rows[0].getAttribute('aria-label')).toBe('Shipping speed');
    expect(rows[0].hasAttribute('tabindex')).toBe(false);
  });

  it('retains author updates to managed attributes and an explicit existing tab stop', () => {
    const { root, rows } = mountDemo();
    rows[0].setAttribute('tabindex', '0');
    setBox(rows[0], 700, 324);
    syncScrollRegions(root, { context: 'Choicebox', demoRows: true });
    rows[0].setAttribute('role', 'group');
    rows[0].setAttribute('aria-label', 'Updated delivery choices');
    syncScrollRegions(root, { context: 'Choicebox', demoRows: true });
    expect(rows[0].getAttribute('role')).toBe('group');
    expect(rows[0].getAttribute('aria-label')).toBe('Updated delivery choices');
    setBox(rows[0], 324, 324);
    syncScrollRegions(root, { context: 'Choicebox', demoRows: false });
    expect(rows[0].getAttribute('role')).toBe('group');
    expect(rows[0].getAttribute('aria-label')).toBe('Updated delivery choices');
    expect(rows[0].getAttribute('tabindex')).toBe('0');
  });

  it('uses an authored ID reference without adding a competing name', () => {
    const { root, rows } = mountDemo();
    rows[0].setAttribute('aria-labelledby', 'shipping-heading');
    setBox(rows[0], 700, 324);
    syncScrollRegions(root, { context: 'Choicebox', demoRows: true });
    expect(rows[0].getAttribute('aria-labelledby')).toBe('shipping-heading');
    expect(rows[0].hasAttribute('aria-label')).toBe(false);
    setBox(rows[0], 324, 324);
    syncScrollRegions(root, { context: 'Choicebox', demoRows: true });
    expect(rows[0].getAttribute('aria-labelledby')).toBe('shipping-heading');
  });

  it('leaves rows alone at desktop widths, and releases them when the layout widens', () => {
    const { root, rows } = mountDemo();
    setBox(rows[0], 700, 324);
    syncScrollRegions(root, { context: 'Stepper', demoRows: false });
    expect(rows[0].hasAttribute('tabindex')).toBe(false);
    expect(rows[0].hasAttribute('data-scroll-region')).toBe(false);

    syncScrollRegions(root, { context: 'Stepper', demoRows: true });
    expect(rows[0].getAttribute('tabindex')).toBe('0');

    syncScrollRegions(root, { context: 'Stepper', demoRows: false });
    expect(rows[0].hasAttribute('tabindex')).toBe(false);
    expect(rows[0].hasAttribute('role')).toBe(false);
    expect(rows[0].hasAttribute('data-scroll-region')).toBe(false);
  });

  it('prefers the heading inside a row over one above it', () => {
    const root = document.createElement('main');
    root.innerHTML =
      '<h2>Section</h2><div class="demo-row"><h3>Inner title</h3><span>x</span></div>';
    document.body.append(root);
    const [row] = root.querySelectorAll<HTMLElement>('.demo-row');
    setBox(row, 700, 324);
    syncScrollRegions(root, { context: 'Stepper', demoRows: true });
    expect(row.getAttribute('aria-label')).toBe('Example: Inner title');
  });

  it('names a row with no heading above it after the page', () => {
    const root = document.createElement('main');
    root.innerHTML = '<div class="demo-row"></div>';
    document.body.append(root);
    const [row] = root.querySelectorAll<HTMLElement>('.demo-row');
    setBox(row, 700, 324);
    syncScrollRegions(root, { context: 'Stepper', demoRows: true });
    expect(row.getAttribute('aria-label')).toBe('Example: Stepper examples');
  });
});

describe('scrollRegions action', () => {
  let resizeCallbacks: ResizeObserverCallback[] = [];
  const observed: Element[] = [];

  beforeEach(() => {
    resizeCallbacks = [];
    observed.length = 0;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          resizeCallbacks.push(callback);
        }
        observe(element: Element): void {
          observed.push(element);
        }
        unobserve(): void {}
        disconnect(): void {}
      }
    );
    // Run the frame callback inline so a test can assert right after the trigger.
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
  });

  it('applies access at mount and follows a resize reported by the observer', () => {
    const root = mountDocs('<h2>Usage</h2><pre><code>w</code></pre>');
    const [block] = pres(root);
    setBox(block, 900, 600);

    const action = scrollRegions(root, DOCS_ONLY);
    expect(block.getAttribute('tabindex')).toBe('0');
    // It watches the block and the box inside it, which is what changes when text grows.
    expect(observed).toContain(block);
    expect(observed).toContain(block.firstElementChild);

    setBox(block, 500, 600);
    // Snapshot first: constructing an observer here would otherwise grow the list
    // while it is iterated.
    const pending = [...resizeCallbacks];
    for (const callback of pending) {
      callback([], new ResizeObserver(() => {}));
    }
    expect(block.hasAttribute('tabindex')).toBe(false);
    action.destroy();
  });

  it('picks up blocks that arrive after mount, as {@html} swaps the rendered docs', async () => {
    const root = mountDocs('<h2>Usage</h2>');
    const action = scrollRegions(root, DOCS_ONLY);

    root.insertAdjacentHTML('beforeend', '<pre><code>new</code></pre>');
    const [block] = pres(root);
    setBox(block, 900, 600);
    // MutationObserver callbacks are delivered as a microtask.
    await Promise.resolve();
    expect(block.getAttribute('tabindex')).toBe('0');
    expect(block.getAttribute('aria-label')).toBe('Code: Usage');
    action.destroy();
  });

  it('re-labels when the fallback context changes', () => {
    const root = mountDocs('<pre><code>x</code></pre>');
    const [block] = pres(root);
    setBox(block, 900, 600);
    const action = scrollRegions(root, DOCS_ONLY);
    expect(block.getAttribute('aria-label')).toBe('Code: Card documentation');

    action.update({ context: 'Select', demoRows: false });
    expect(block.getAttribute('aria-label')).toBe('Code: Select documentation');
    action.destroy();
  });
});
