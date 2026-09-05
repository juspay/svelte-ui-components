import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { LEGACY_PAIRS } from '../scripts/codemod/legacy-pairs';
import {
  readCustomElementDeclaration,
  wrappedComponentPath
} from '../scripts/wc-parity/prop-parity';

/**
 * Every deprecated alias, driven through the built custom element in a real
 * browser: if the lowercase spelling reaches the handler, the camelCase one
 * must too.
 *
 * `deprecated-alias-matrix.test.ts` proves each resolver runs and picks the
 * right value, in jsdom, at the Svelte layer. `wc-event-casing-parity.spec.ts`
 * proves both spellings are real accessors on the element, and drives one
 * component (sui-toggle) end to end. Between them sits the claim a consumer
 * actually depends on and neither makes for the whole set: that setting the old
 * spelling on a real element still gets their handler called when the user
 * interacts.
 *
 * The comparison is self-calibrating, which is what makes it possible without
 * 67 bespoke fixtures. Each pair is driven twice under an identical, blind
 * interaction sweep -- once with only the lowercase spelling set, once with
 * only the camelCase one -- and the lowercase run establishes whether the event
 * is reachable at all. Only pairs it reaches are asserted on; the rest are
 * counted and reported rather than quietly passing.
 *
 * It asserts the alias fires, not how many times. An earlier version compared
 * exact counts and found sui-split-input's `oninput` "diverging" 4 against 6 --
 * which reversed when the two drives swapped order, so it was the component
 * carrying state between drives, not the spelling. Per-event-type probing
 * confirmed the two spellings are identical. Reachability is the claim that
 * survives a stateful component; the count is not.
 */

const WC_DIR = join(process.cwd(), 'src/wc/components');

type Pair = {
  readonly component: string;
  readonly legacy: string;
  readonly corrected: string;
  readonly tag: string;
  readonly base: Readonly<Record<string, unknown>>;
};

/** One object carrying the keys these components commonly read off a row. */
const ROW: Readonly<Record<string, unknown>> = {
  id: 'a',
  key: 'a',
  name: 'x',
  label: 'x',
  text: 'x',
  title: 'x',
  value: 'x',
  content: 'x',
  src: '',
  url: '',
  type: 'text',
  status: 'error',
  role: 'user',
  message: 'x',
  size: 1,
  index: 0,
  count: 1,
  disabled: false,
  selected: false,
  items: [],
  children: [],
  actions: [],
  data: [],
  rows: [],
  columns: []
};

/**
 * States these events hang off — a modal fires nothing while closed, a banner
 * has no dismiss control unless it is dismissible. Applied blind to every
 * element, so this stays free of per-component knowledge; a tag that does not
 * declare one simply ignores it.
 */
const OPENERS: Readonly<Record<string, unknown>> = {
  open: true,
  visible: true,
  show: true,
  expand: true,
  expanded: true,
  active: true,
  dismissible: true,
  closable: true,
  clearable: true,
  removable: true,
  editable: true,
  selectable: true,
  multiple: true,
  showClose: true,
  showRetry: true,
  showFeedback: true,
  showActions: true,
  interactive: true,
  enabled: true,
  disabled: false,
  loading: false
};

/** Required (non-optional) props, with the emptiest value their type accepts. */
const requiredProps = (componentFile: string): Record<string, unknown> => {
  const file = join(dirname(componentFile), 'properties.ts');
  if (!existsSync(file)) {
    return {};
  }
  const props: Record<string, unknown> = {};
  let inType = false;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (/^export (type|interface) \w*Properties\b/.test(line)) {
      inType = true;
      continue;
    }
    if (inType && /^\}/.test(line)) {
      inType = false;
      continue;
    }
    if (!inType) {
      continue;
    }
    const match = /^ {2}(\w+):\s*(.+?);?\s*$/.exec(line);
    if (match === null) {
      continue;
    }
    const [, name, type] = match;
    if (/\[\]$/.test(type) || /^Array</.test(type)) {
      props[name] = [ROW, ROW];
    } else if (type === 'string') {
      props[name] = 'x';
    } else if (type === 'number') {
      props[name] = 1;
    } else if (type === 'boolean') {
      props[name] = true;
    } else if (/^'[^']*'(\s*\|\s*'[^']*')*$/.test(type)) {
      props[name] = type.split('|')[0].trim().slice(1, -1);
    }
  }
  return props;
};

/** Every tag, with the event props it declares and a fixture that renders it. */
const everyTagsEventProps = (): readonly {
  readonly tag: string;
  readonly props: readonly string[];
  readonly base: Readonly<Record<string, unknown>>;
}[] => {
  const out: { tag: string; props: readonly string[]; base: Record<string, unknown> }[] = [];
  for (const file of readdirSync(WC_DIR).filter((name) => name.endsWith('.wc.svelte'))) {
    const source = readFileSync(join(WC_DIR, file), 'utf8');
    const { tag, props } = readCustomElementDeclaration(source);
    const componentPath = wrappedComponentPath(source);
    if (tag === null || componentPath === null) {
      continue;
    }
    const events = props.filter((name) => /^on[A-Za-z]/.test(name));
    if (events.length > 0) {
      out.push({ tag, props: events, base: { ...requiredProps(componentPath), ...OPENERS } });
    }
  }
  return out;
};

/** Maps each exported component to the tag that wraps it, via the wrappers. */
const pairsWithWrappers = (): {
  readonly covered: readonly Pair[];
  readonly unwrapped: readonly string[];
} => {
  const tags = new Map<string, { tag: string; file: string }>();
  for (const file of readdirSync(WC_DIR).filter((name) => name.endsWith('.wc.svelte'))) {
    const source = readFileSync(join(WC_DIR, file), 'utf8');
    const { tag } = readCustomElementDeclaration(source);
    const componentPath = wrappedComponentPath(source);
    if (tag === null || componentPath === null) {
      continue;
    }
    tags.set(basename(componentPath, '.svelte'), { tag, file: componentPath });
  }

  const covered: Pair[] = [];
  const unwrapped: string[] = [];
  for (const { component, legacy, corrected } of LEGACY_PAIRS) {
    const entry = tags.get(component);
    if (typeof entry === 'undefined') {
      unwrapped.push(`${component}.${legacy}`);
      continue;
    }
    covered.push({
      component,
      legacy,
      corrected,
      tag: entry.tag,
      base: { ...requiredProps(entry.file), ...OPENERS }
    });
  }
  return { covered, unwrapped };
};

const loadBundle = async (page: Page): Promise<void> => {
  await page.goto('/');
  await page.addScriptTag({ path: 'dist-wc/index.js', type: 'module' });
  await page.waitForFunction(() => typeof customElements.get('sui-toggle') === 'function', null, {
    timeout: 15_000
  });
};

type SweepSpec = {
  readonly tag: string;
  readonly base: Readonly<Record<string, unknown>>;
  readonly props: readonly string[];
};

type SweepResult = { readonly tag: string; readonly prop: string; readonly fired: number };

/**
 * Mounts each tag once per prop and counts how many times that prop's handler
 * ran under a blind interaction sweep — click, focus, and every plausible
 * mouse, pointer, keyboard and lifecycle event, on every node in the shadow
 * root plus the host.
 *
 * Self-contained on purpose: Playwright serialises this to run in the page, so
 * it cannot close over anything in this module.
 */
const sweepInPage = async (specs: readonly SweepSpec[]): Promise<SweepResult[]> => {
  // Anchors and form submits would navigate the harness away mid-sweep.
  document.addEventListener('click', (event) => event.preventDefault(), true);
  document.addEventListener('submit', (event) => event.preventDefault(), true);

  const plain = [
    'input',
    'change',
    'toggle',
    'scroll',
    'load',
    'error',
    'ended',
    'play',
    'pause',
    'timeupdate',
    'volumechange',
    'select',
    'reset',
    'invalid',
    'animationend',
    'transitionend',
    'submit'
  ];
  const mouse = [
    'mousedown',
    'mouseup',
    'mouseenter',
    'mouseover',
    'mouseleave',
    'mousemove',
    'dblclick',
    'contextmenu'
  ];
  const pointer = ['pointerdown', 'pointerup', 'pointerenter', 'pointerover', 'pointerleave'];
  const keys = [
    'Enter',
    ' ',
    'ArrowDown',
    'ArrowUp',
    'ArrowRight',
    'ArrowLeft',
    'Escape',
    'Backspace'
  ];

  const drive = async (
    tag: string,
    base: Record<string, unknown>,
    prop: string
  ): Promise<number> => {
    document.body.replaceChildren();
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(base)) {
      try {
        Reflect.set(element, key, value);
      } catch {
        /* a prop this element does not declare */
      }
    }
    // Light DOM, so slot-driven components render something to interact with.
    const slotted = document.createElement('button');
    slotted.textContent = 'x';
    element.append(slotted);

    let fired = 0;
    try {
      Reflect.set(element, prop, () => {
        fired += 1;
      });
    } catch {
      // -1 is the sentinel for "assigning to this declared prop threw", which
      // is a different failure from "it never fired".
      return -1;
    }
    document.body.append(element);
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const root = element.shadowRoot;
    const nodes = root === null ? [] : [...root.querySelectorAll('*')];
    for (const node of [...nodes, slotted, element]) {
      const fire = (event: Event): void => {
        try {
          node.dispatchEvent(event);
        } catch {
          /* a guard inside the component */
        }
      };
      try {
        if (node instanceof HTMLElement) {
          node.click();
          node.focus();
        }
      } catch {
        /* not focusable */
      }
      for (const type of plain) {
        fire(new Event(type, { bubbles: true, cancelable: true }));
      }
      for (const type of mouse) {
        fire(new MouseEvent(type, { bubbles: true, cancelable: true }));
      }
      for (const type of pointer) {
        fire(new PointerEvent(type, { bubbles: true, cancelable: true }));
      }
      for (const key of keys) {
        for (const type of ['keydown', 'keyup', 'keypress']) {
          fire(new KeyboardEvent(type, { key, bubbles: true, cancelable: true }));
        }
      }
      for (const type of ['focus', 'blur', 'focusin', 'focusout']) {
        fire(new FocusEvent(type, { bubbles: true }));
      }
    }
    await new Promise((resolve) => requestAnimationFrame(resolve));
    element.remove();
    return fired;
  };

  const out: SweepResult[] = [];
  for (const spec of specs) {
    for (const prop of spec.props) {
      out.push({ tag: spec.tag, prop, fired: await drive(spec.tag, { ...spec.base }, prop) });
    }
  }
  return out;
};

test.describe('deprecated aliases reach the handler through the built element', () => {
  test('wherever the lowercase spelling is reachable, the camelCase alias is too', async ({
    page
  }) => {
    test.setTimeout(300_000);
    await loadBundle(page);

    const { covered, unwrapped } = pairsWithWrappers();
    expect(covered.length, 'no wrapped pairs found — the fixture is broken').toBeGreaterThan(150);

    // Each pair is one spec driving the lowercase spelling then the camelCase
    // one, so both runs meet an identical sweep.
    const swept = await page.evaluate(
      sweepInPage,
      covered.map(({ tag, corrected, legacy, base }) => ({ tag, base, props: [corrected, legacy] }))
    );

    const results = covered.map((pair, index) => ({
      tag: pair.tag,
      legacy: pair.legacy,
      corrected: pair.corrected,
      canonical: swept[index * 2].fired,
      alias: swept[index * 2 + 1].fired
    }));

    const reachable = results.filter((row) => row.canonical > 0);
    const broken = reachable.filter((row) => row.alias === 0);

    // The claim: an alias that the lowercase spelling can reach is reachable too.
    expect(
      broken.map((row) => `${row.tag}.${row.legacy}`),
      'these elements answer the lowercase spelling but ignore the deprecated one, ' +
        'so a consumer who has not migrated silently loses the handler'
    ).toEqual([]);

    // A floor, so a change that stops the sweep reaching anything fails loudly
    // rather than passing with an empty set.
    expect(
      reachable.length,
      `only ${reachable.length} of ${results.length} wrapped pairs were reachable by the generic ` +
        `sweep; it used to reach at least 55. Something stopped rendering or stopped responding.`
    ).toBeGreaterThanOrEqual(55);

    // Reported, not asserted: the sweep cannot reach an event that needs state
    // it does not know how to produce, and 19 pairs have no custom element at
    // all (the charts, and Step). Those are covered at the Svelte layer by
    // src/deprecated-alias-matrix.test.ts.
    console.log(
      `[alias reachability] ${reachable.length}/${results.length} wrapped pairs reachable, ` +
        `${results.length - reachable.length} not reachable by a blind sweep, ` +
        `${unwrapped.length} pairs have no custom element (${unwrapped.slice(0, 4).join(', ')}…).`
    );
  });

  test('every declared event prop on every element is settable, and the reachable set holds', async ({
    page
  }) => {
    test.setTimeout(300_000);
    await loadBundle(page);

    // The whole declared surface, not just the aliased half: both spellings of
    // every pair plus every event prop that never had an alias.
    const tags = everyTagsEventProps();
    const total = tags.reduce((sum, entry) => sum + entry.props.length, 0);
    expect(total, 'no declared event props found — the fixture is broken').toBeGreaterThan(300);

    const swept = await page.evaluate(
      sweepInPage,
      tags.map(({ tag, props, base }) => ({ tag, base, props }))
    );

    // A negative count is the sentinel for a setter that threw. `wc-prop-parity`
    // proves each of these is a real accessor; this proves assigning to it does
    // not blow up on a mounted element.
    const threw = swept.filter((row) => row.fired < 0);
    expect(
      threw.map((row) => `${row.tag}.${row.prop}`),
      'assigning these threw'
    ).toEqual([]);

    const reached = swept.filter((row) => row.fired > 0);

    // The measured floor. This is the number of declared event props a blind
    // sweep can actually get the component to call — it is not all of them,
    // because many need state the sweep cannot invent (a modal that is closed,
    // a chat with no failed message to retry). Pinning it means a change that
    // silently stops forwarding props fails here instead of passing quietly.
    expect(
      reached.length,
      `only ${reached.length} of ${total} declared event props were reachable; it used to be at ` +
        `least 120. A wrapper that stopped forwarding, or a component that stopped rendering, ` +
        `would look exactly like this.`
    ).toBeGreaterThanOrEqual(120);

    console.log(
      `[declared event props] ${reached.length}/${total} reachable across ${tags.length} elements.`
    );
  });
});
