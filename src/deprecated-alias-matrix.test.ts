import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/svelte';
import { createRawSnippet, flushSync, type Component } from 'svelte';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { LEGACY_PAIRS } from '../scripts/codemod/legacy-pairs';
import { resetDeprecationWarnings } from './lib/deprecation';

/**
 * Every deprecated spelling this library still accepts, driven through the
 * real component that declares it.
 *
 * The rest of the suite tests the spellings components are *supposed* to be
 * called with, which is exactly the half that cannot regress: a renamed prop
 * that never reached its handler would fail the component's own test on the
 * first run. The aliases are the half nothing else watches. They were produced
 * mechanically for 67 components at once, they are read by no other test, and
 * the way they fail is silent -- a consumer's handler simply never fires, with
 * no error to notice. Two of them were covered before this file existed.
 *
 * What makes the whole set checkable in one pass is that the warning is
 * emitted eagerly. `readDeprecatedProps` in an `$effect.pre` forces each alias
 * `$derived` to evaluate at mount, so passing a legacy prop produces a console
 * warning naming the exact triple `resolveDeprecatedProp` was called with,
 * whether or not the event is ever fired. Asserting on that message therefore
 * proves the whole chain per pair: the prop is declared, it is destructured
 * under the legacy name, a resolver names it with the right component and
 * replacement, and the result is read at mount. A pair that was declared but
 * never wired warns nothing and fails here.
 *
 * The source of truth is `LEGACY_PAIRS`, generated from the `@deprecated` tags
 * themselves, so a pair added later is covered by this file the moment it is
 * generated -- there is no list here to forget to update.
 *
 * It sits in `src/` rather than `src/lib/` because `svelte-package` publishes
 * `src/lib` wholesale, test files included, and this one imports `LEGACY_PAIRS`
 * from `scripts/` -- outside the packaged root, so the published copy would
 * carry an import that resolves to nothing.
 */

const LIB_ROOT = join(process.cwd(), 'src/lib');

/**
 * Maps the component name a consumer imports to the file that defines it, by
 * reading the barrel rather than assuming `<Dir>/<Name>.svelte`. Stepper's
 * directory declares two components, and `Step` is the one that would break a
 * naive path guess.
 */
const componentPaths = (): ReadonlyMap<string, string> => {
  const barrel = readFileSync(join(LIB_ROOT, 'index.ts'), 'utf8');
  const entries = new Map<string, string>();
  for (const line of barrel.split('\n')) {
    const match = /^export \{ default as (\w+) \} from '\.\/([^']+\.svelte)';/.exec(line);
    if (match !== null) {
      // Rebased onto this file's directory, which is one level above the barrel's.
      entries.set(match[1], `./lib/${match[2]}`);
    }
  }
  return entries;
};

type AnyComponent = Component<Record<string, unknown>>;

const PATHS = componentPaths();
const MODULES = import.meta.glob<{ readonly default: AnyComponent }>('./lib/**/*.svelte');

const stubSnippet = () => createRawSnippet(() => ({ render: () => '<span></span>' }));

/**
 * Props a component needs before it will mount at all, read off the
 * non-optional entries in its own `properties.ts` rather than guessed.
 *
 * Only the components that actually threw are listed, and the values are the
 * emptiest thing that satisfies the declaration -- nothing here looks at
 * rendered output, so an empty series and a realistic one prove the same
 * thing. A component that renders its empty state still runs the `$effect.pre`
 * that reads the aliases, which is the whole of what this file measures.
 */
const REQUIRED_PROPS: Readonly<Record<string, Readonly<Record<string, unknown>>>> = {
  AreaChart: { series: [] },
  Book: { pages: [] },
  Chat: { messages: [] },
  ChatMessageList: { messages: [] },
  Checkbox: { text: 'label' },
  DualAxisBarChart: { categories: [], series: [] },
  FileDropzoneTrigger: { icon: 'upload', heading: 'Drop files' },
  FileInput: { trigger: stubSnippet() },
  FunnelChart: { data: [] },
  LineChart: { series: [] },
  MediaPlayer: { src: 'media.mp4', type: 'video' },
  PieChart: { data: [] },
  SankeyChart: { nodes: [], links: [] },
  Scroller: { children: stubSnippet() },
  Tabs: { items: [] },
  TaskList: { rows: [] },
  ToolCallLog: { chips: [] },
  TypewriterText: { text: 'hello' }
};

/**
 * Browser APIs jsdom does not implement, stubbed for this file only.
 *
 * They are deliberately not in `vitest-setup.ts`: the components that use
 * these have their own suites built around jsdom's actual behaviour, and
 * giving all 563 of those tests a `ResizeObserver` that never fires would
 * change what they measure. Here the stubs exist only so the component reaches
 * the end of its own setup, and no assertion depends on what they return.
 */
beforeAll(() => {
  class StubResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  Reflect.set(globalThis, 'ResizeObserver', StubResizeObserver);

  Reflect.set(window, 'matchMedia', (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false
  }));

  // lottie-web paints into a 2d context at import time and jsdom returns null
  // for every context, which throws before MediaPlayer's module even finishes
  // loading.
  Reflect.set(HTMLCanvasElement.prototype, 'getContext', () => ({
    fillRect: () => {},
    clearRect: () => {},
    getImageData: () => ({ data: [] }),
    putImageData: () => {},
    createImageData: () => [],
    setTransform: () => {},
    drawImage: () => {},
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    stroke: () => {},
    fill: () => {},
    measureText: () => ({ width: 0 }),
    canvas: { width: 0, height: 0 }
  }));
});

const loadComponent = async (name: string): Promise<AnyComponent> => {
  const path = PATHS.get(name);
  if (typeof path === 'undefined') {
    throw new Error(`${name} is not exported from src/lib/index.ts`);
  }
  const loader = MODULES[path];
  if (typeof loader === 'undefined') {
    throw new Error(`${name} resolves to ${path}, which the glob did not match`);
  }
  return (await loader()).default;
};

const warnings = (): readonly string[] =>
  vi.mocked(console.warn).mock.calls.map((call) => String(call[0]));

describe('every deprecated event-prop alias reaches its component', () => {
  beforeEach(() => {
    // The suppression set is module-level and survives between cases, so
    // without this a pair would pass by inheriting an earlier pair's silence.
    resetDeprecationWarnings();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('covers every pair the library declares', () => {
    expect(LEGACY_PAIRS.length).toBeGreaterThan(150);
  });

  for (const { component, legacy, corrected } of LEGACY_PAIRS) {
    it(`${component}.${legacy} resolves to ${corrected}`, async () => {
      const Component = await loadComponent(component);
      const base = REQUIRED_PROPS[component] ?? {};
      const handler = vi.fn();

      // 1. The legacy spelling alone: the value takes effect, so the consumer
      //    is told once, and told which spelling replaces it.
      render(Component, { ...base, [legacy]: handler });
      flushSync();

      const named = warnings().filter(
        (message) => message.includes(`\`${legacy}\` on <${component}>`) === true
      );
      expect(
        named,
        `<${component}> never resolved its deprecated \`${legacy}\` prop — a consumer ` +
          `passing it would get silence and no handler. Saw: ${JSON.stringify(warnings())}`
      ).toHaveLength(1);
      expect(named[0]).toContain(`Use \`${corrected}\` instead`);

      // 2. The corrected spelling alone is not deprecated behaviour and must
      //    not warn — a false warning is as wrong as a missing one.
      resetDeprecationWarnings();
      vi.mocked(console.warn).mockClear();
      render(Component, { ...base, [corrected]: handler });
      flushSync();
      expect(
        warnings().filter((message) => message.includes(`on <${component}>`) === true),
        `<${component}> warned about \`${corrected}\`, which is the spelling it asks for`
      ).toEqual([]);

      // 3. Both set: the corrected value wins, so nothing is deprecated about
      //    the call and there is nothing to say.
      resetDeprecationWarnings();
      vi.mocked(console.warn).mockClear();
      render(Component, { ...base, [legacy]: handler, [corrected]: handler });
      flushSync();
      expect(
        warnings().filter((message) => message.includes(`on <${component}>`) === true),
        `<${component}> warned with \`${corrected}\` set, so the legacy value is winning`
      ).toEqual([]);
    });
  }
});
