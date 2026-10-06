/**
 * Keyboard access for the horizontally scrolling blocks of the example app.
 *
 * A `<pre>` wider than its column scrolls inside its own box. Chromium and
 * Firefox make such a scroller reachable by Tab on their own; WebKit does not,
 * so there a keyboard user could neither reach the code nor scroll it. Giving
 * every block a tab stop would be the wrong fix: most blocks fit, and an
 * always-present stop on each is noise a screen reader has to read past. So a
 * block is made a labelled, focusable region exactly while it overflows, and is
 * left alone while it fits.
 *
 * "While" matters: the answer changes with viewport width, text size and content,
 * so it is recomputed from observers rather than decided once at mount.
 *
 * Two families of block are managed:
 *
 *  - documentation blocks (`.markdown-body pre` and the `.docs-table-scroll`
 *    wrapper the docs renderer puts round each table), at every width. Their CSS
 *    already scrolls them; this only makes that scrolling reachable.
 *  - `.demo-row` example rows (and any other example container that opts in with
 *    the `demo-scroll` class), whenever their actual content exceeds the column. A fixed-width
 *    example (a 600px card, a 695px stepper, a 375px phone frame) cannot fit a
 *    390px column, so the row scrolls instead of widening the whole document. At
 *    intermediate widths also need this when a persistent sidebar narrows the
 *    available main column. Rows are NOT clipped
 *    unconditionally: an `overflow` on every row would also clip the popovers of
 *    the examples that fit.
 */

type Kind = 'code' | 'table' | 'example';

export type ScrollRegionOptions = {
  /** Names a block that has no heading above it ("Card" gives "Card documentation"). */
  context: string;
  /** Also manage `.demo-row` rows using their actual available width. */
  demoRows: boolean;
};

const DOC_BLOCKS = '.markdown-body pre, .markdown-body .docs-table-scroll';
const DEMO_ROWS = '.demo-row, .demo-scroll';
const TABLE_SCROLL = '.docs-table-scroll';

/**
 * Marks the attributes this module wrote, so it never strips ones an author set.
 * The stylesheet keys the demo rows' `overflow-x: auto` off it too, which is what
 * keeps a row's overflow `visible` until it actually needs to scroll.
 */
const MANAGED_ATTRIBUTE = 'data-scroll-region';

const LANGUAGE_NAMES: Readonly<Record<string, string>> = {
  svelte: 'Svelte',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  js: 'JavaScript',
  javascript: 'JavaScript',
  json: 'JSON',
  css: 'CSS',
  html: 'HTML',
  bash: 'Shell',
  sh: 'Shell',
  shell: 'Shell',
  md: 'Markdown',
  markdown: 'Markdown'
};

const HEADING = /^H[1-6]$/;

function kindOf(block: HTMLElement): Kind {
  if (block.matches(TABLE_SCROLL)) {
    return 'table';
  }
  return block.matches(DEMO_ROWS) ? 'example' : 'code';
}

function languageOf(block: HTMLElement): string | null {
  const code = block.querySelector('code');
  if (code === null) {
    return null;
  }
  for (const name of code.classList) {
    if (name.startsWith('language-')) {
      return LANGUAGE_NAMES[name.slice('language-'.length).toLowerCase()] ?? null;
    }
  }
  return null;
}

/** An example row usually carries its own title as its first child. */
function headingWithin(block: HTMLElement): string | null {
  const heading = block.querySelector('h1, h2, h3, h4, h5, h6');
  const text = heading?.textContent?.trim() ?? '';
  return text.length > 0 ? text : null;
}

/**
 * The text of the closest heading above `block`, climbing out of wrappers (a list
 * item, a blockquote, a demo section) when nothing precedes it at its own level.
 */
function headingAbove(block: Element, root: Element): string | null {
  let node: Element | null = block;
  while (node !== null && node !== root) {
    let sibling: Element | null = node.previousElementSibling;
    while (sibling !== null) {
      if (HEADING.test(sibling.tagName)) {
        const text = sibling.textContent?.trim() ?? '';
        if (text.length > 0) {
          return text;
        }
      }
      sibling = sibling.previousElementSibling;
    }
    node = node.parentElement;
  }
  return null;
}

function kindLabel(block: HTMLElement): string {
  const kind = kindOf(block);
  if (kind === 'table') {
    return 'Table';
  }
  if (kind === 'example') {
    return 'Example';
  }
  const language = languageOf(block);
  return language === null ? 'Code' : `${language} code`;
}

function fallbackSection(block: HTMLElement, context: string): string {
  return kindOf(block) === 'example' ? `${context} examples` : `${context} documentation`;
}

/**
 * Names every block for assistive technology: what it is, which section it sits
 * in, and "n of m" when a section holds several of the same kind.
 *
 * The numbering is over ALL blocks, not just the overflowing ones, so a block's
 * name does not change when another block starts or stops overflowing.
 */
export function describeBlocks(
  blocks: readonly HTMLElement[],
  root: Element,
  context: string
): Map<HTMLElement, string> {
  const entries = blocks.map((block) => ({
    block,
    kind: kindLabel(block),
    section:
      (kindOf(block) === 'example' ? headingWithin(block) : null) ??
      headingAbove(block, root) ??
      fallbackSection(block, context)
  }));
  const totals = new Map<string, number>();
  for (const { kind, section } of entries) {
    const key = JSON.stringify([kind, section]);
    totals.set(key, (totals.get(key) ?? 0) + 1);
  }
  const seen = new Map<string, number>();
  const labels = new Map<HTMLElement, string>();
  for (const { block, kind, section } of entries) {
    const key = JSON.stringify([kind, section]);
    const position = (seen.get(key) ?? 0) + 1;
    seen.set(key, position);
    const total = totals.get(key) ?? 1;
    labels.set(
      block,
      total > 1 ? `${kind} ${position} of ${total}: ${section}` : `${kind}: ${section}`
    );
  }
  return labels;
}

function blocksUnder(root: HTMLElement, options: ScrollRegionOptions): HTMLElement[] {
  const selector = options.demoRows ? `${DOC_BLOCKS}, ${DEMO_ROWS}` : DOC_BLOCKS;
  return [...root.querySelectorAll<HTMLElement>(selector)];
}

// Track only attributes this action owns. A demo row can already be a named
// radiogroup; making its overflow reachable must retain that authored contract.
const regionAttributes = new WeakMap<HTMLElement, Map<string, string>>();

function writeRegionAttribute(
  block: HTMLElement,
  attributes: Map<string, string>,
  name: string,
  value: string
): void {
  const current = block.getAttribute(name);
  const written = attributes.get(name) ?? null;
  if (written === null ? current !== null : current !== written) {
    // An existing attribute, or a caller update while managed, belongs to its author.
    return;
  }
  attributes.set(name, value);
  block.setAttribute(name, value);
}

function setRegion(block: HTMLElement, label: string): void {
  let attributes = regionAttributes.get(block) ?? null;
  if (attributes === null) {
    attributes = new Map();
    regionAttributes.set(block, attributes);
  }
  writeRegionAttribute(block, attributes, MANAGED_ATTRIBUTE, '');
  writeRegionAttribute(block, attributes, 'tabindex', '0');
  writeRegionAttribute(block, attributes, 'role', 'region');
  if (!block.hasAttribute('aria-labelledby')) {
    writeRegionAttribute(block, attributes, 'aria-label', label);
  }
}

function clearRegion(block: HTMLElement): void {
  const attributes = regionAttributes.get(block) ?? null;
  if (attributes === null) {
    return;
  }
  for (const [name, written] of attributes) {
    if (block.getAttribute(name) === written) {
      block.removeAttribute(name);
    }
  }
  regionAttributes.delete(block);
}

/**
 * Applies the region attributes to every managed block under `root` that
 * currently overflows horizontally and removes them from every one that does not
 * (including a demo row left over from the compact layout).
 */
export function syncScrollRegions(root: HTMLElement, options: ScrollRegionOptions): void {
  const blocks = blocksUnder(root, options);
  const labels = describeBlocks(blocks, root, options.context);
  for (const block of blocks) {
    if (block.scrollWidth > block.clientWidth) {
      setRegion(block, labels.get(block) ?? 'Scrollable content');
    } else {
      clearRegion(block);
    }
  }
  if (!options.demoRows) {
    for (const row of root.querySelectorAll<HTMLElement>(DEMO_ROWS)) {
      clearRegion(row);
    }
  }
}

/**
 * The elements whose size reports a change to the block's overflow. A block that
 * scrolls does not change size when its content gets wider, only what is inside
 * it does: the code's box (see `pre code` in the docs stylesheet), the table, or
 * the example's children.
 */
function watchTargets(block: HTMLElement): Element[] {
  if (block.matches(DEMO_ROWS)) {
    return [block, ...block.children];
  }
  const inner = block.firstElementChild;
  return inner === null ? [block] : [block, inner];
}

export type ScrollRegionsAction = {
  update: (options: ScrollRegionOptions) => void;
  destroy: () => void;
};

/**
 * Svelte action for the element that holds the page. Re-syncs when a managed
 * block (or what is inside it) resizes, when elements are added or removed, and
 * when the window resizes; coalesced to one pass per frame.
 *
 * `{@html}` replaces the docs wholesale on navigation, so the observed set is
 * rebuilt on every pass rather than captured once.
 */
export function scrollRegions(
  root: HTMLElement,
  initialOptions: ScrollRegionOptions
): ScrollRegionsAction {
  let options = initialOptions;
  let frame = 0;
  const observed = new Set<Element>();

  const resizeObserver = new ResizeObserver(() => {
    schedule();
  });

  function observeBlocks(): void {
    const current = new Set<Element>();
    for (const block of blocksUnder(root, options)) {
      for (const target of watchTargets(block)) {
        current.add(target);
      }
    }
    for (const element of observed) {
      if (!current.has(element)) {
        resizeObserver.unobserve(element);
        observed.delete(element);
      }
    }
    for (const element of current) {
      if (!observed.has(element)) {
        resizeObserver.observe(element);
        observed.add(element);
      }
    }
  }

  function run(): void {
    if (frame !== 0) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    observeBlocks();
    syncScrollRegions(root, options);
  }

  function schedule(): void {
    if (frame === 0) {
      frame = requestAnimationFrame(run);
    }
  }

  // Element additions and removals only: text changes inside an example do not
  // alter which blocks exist, and the resize observer covers the ones that alter
  // a block's width.
  //
  // Synchronous, not a frame later: mutation callbacks are delivered before the
  // browser paints, so a newly rendered page never gets a painted frame in which
  // a wide example still widens the document. (A resize callback must defer,
  // because making a row scrollable can change its height.)
  const mutationObserver = new MutationObserver(run);
  mutationObserver.observe(root, { childList: true, subtree: true });
  window.addEventListener('resize', schedule);
  document.fonts?.addEventListener('loadingdone', schedule);

  run();

  return {
    update(next: ScrollRegionOptions): void {
      options = next;
      run();
    },
    destroy(): void {
      if (frame !== 0) {
        cancelAnimationFrame(frame);
      }
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', schedule);
      document.fonts?.removeEventListener('loadingdone', schedule);
      observed.clear();
    }
  };
}
