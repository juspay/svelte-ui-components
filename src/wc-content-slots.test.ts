import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compile } from 'svelte/compiler';
import { describe, expect, it } from 'vitest';
import { WC2_UNREACHABLE } from '../scripts/wc2-unreachable.mjs';
import { REPO_SCAN_TIMEOUT_MS } from '../scripts/migrate/repo-scan-timeout';
import { readComponentImplementation } from '../scripts/wc-parity/prop-parity.js';

/**
 * The content-slot rule's closing claim, held in place: the argument-less content props
 * of these twelve components are reachable from HTML, and the ones that are NOT are
 * unreachable for a stated, checkable reason rather than because nobody got to them.
 *
 * The reason matters more than the decision here, because the failure it guards against
 * is invisible. Svelte's custom-element layer appends one `<slot>` element per render
 * site (`create_slot` in svelte/internal/client/dom/elements/custom-element.js), and the
 * DOM assigns light-DOM children to the FIRST matching slot in the shadow tree only. A
 * snippet the component renders once per array entry therefore gets the consumer's markup
 * on entry one and renders EMPTY on every entry after it -- and empty, not defaulted,
 * because the generated per-site slot carries no fallback content. Verified end to end
 * against Svelte 5.56.3: with three entries, site 0 received the slotted node and sites 1
 * and 2 rendered nothing at all.
 *
 * So `NOT_BRIDGED` does not merely record "we skipped this". Each entry names the shape
 * that makes a slot wrong, and the test re-derives that shape from the component source.
 * If a refactor moves `removeIcon` out of its `{#each}`, this test fails and asks for the
 * decision to be made again, rather than quietly keeping a restriction that has expired.
 */

const ROOT = process.cwd();
const read = (path: string): string => readFileSync(join(ROOT, path), 'utf8');
const wrapper = (component: string): string => read(`src/wc/components/${component}.wc.svelte`);
const source = (component: string): string => read(`src/lib/${component}/${component}.svelte`);
const docs = (component: string): string => read(`docs/${component}.md`);

const WC2_COMPONENTS = [
  'AttachmentChipRow',
  'Book',
  'Breadcrumb',
  'Card',
  'ChatToolStatus',
  'Combobox',
  'DateRangePicker',
  'Gallery',
  'HITL',
  'Input',
  'MediaPlayer',
  'MediaUpload',
  'Progress',
  'Status',
  'Stepper',
  'ThemeSwitcher',
  'ThinkingIndicator'
] as const;

type Component = (typeof WC2_COMPONENTS)[number];

/** `leftIcon` -> `left-icon`, the slot-naming convention these wrappers follow. */
const kebab = (prop: string): string => prop.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/** Argument-less `Snippet` props, which are the only ones a named slot can express. */
const argumentlessSnippetProps = (component: Component): ReadonlySet<string> => {
  const text = read(`src/lib/${component}/properties.ts`);
  return new Set([...text.matchAll(/(\w+)\??\s*:\s*Snippet(?!<)/g)].map((m) => m[1]));
};

/**
 * Slot names the wrapper actually declares. Takes `string` rather than `Component`
 * because NOT_BRIDGED entries (re-derived from scripts/wc2-unreachable.mjs, a plain
 * JSDoc-typed module) carry a `component: string` field -- see readInsideEach's
 * comment for why narrowing it back would need a banned type assertion.
 */
const declaredSlots = (component: string): ReadonlySet<string> =>
  new Set([...wrapper(component).matchAll(/<slot\s+name="([a-z0-9-]+)"/g)].map((m) => m[1]));

/**
 * Is `prop` read inside an `{#each}` block? Depth counting rather than "is there an
 * `{#each}` earlier in the file", which would call every prop in a component that
 * iterates anything per-item.
 *
 * Takes a plain `string` rather than `Component`: its only caller below re-derives
 * `NOT_BRIDGED` from scripts/wc2-unreachable.mjs, a plain-ESM module with JSDoc types
 * (it has to run under `node` with no build step), so its
 * `component` field is `string` -- narrowing it back to the `Component` union here
 * would need a type assertion, which this repo's lint config bans outright.
 */
const readInsideEach = (component: string, prop: string): boolean => {
  const text = readComponentImplementation(
    join(ROOT, 'src/lib', component, component + '.svelte')
  ).source;
  const tokens = [...text.matchAll(/\{#each\b|\{\/each\}|\b\w+\b/g)];
  let depth = 0;
  for (const token of tokens) {
    if (token[0] === '{#each') {
      depth += 1;
    } else if (token[0] === '{/each}') {
      depth -= 1;
    } else if (token[0] === prop && depth > 0) {
      return true;
    }
  }
  return false;
};

/** Does the component's own props type carry this prop, or is it per-item data? */
/**
 * Whether `prop` is destructured from the component's OWN `$props()`.
 *
 * This used to slice 900 characters before `$props()` and match a regex that
 * could only reach 400 characters in, so a prop sitting late in a long
 * destructuring read as NOT a component prop. Table declares 40-odd props, and
 * `headerTooltipIcon` is one of them: the check returned false for a prop that
 * is plainly there. That is a false negative in the direction that CONFIRMS a
 * `notAComponentProp` entry, so a misclassification would have been rubber
 * stamped by the very assertion meant to catch it -- found by negative control,
 * which changed a shape to the wrong value and watched the suite stay green.
 *
 * It now extracts the destructuring by balancing braces from `let {` to
 * `} = $props()`, so length cannot defeat it.
 */
const destructuredProps = (component: string): ReadonlySet<string> => {
  const text = source(component);
  const start = text.indexOf('let {');
  if (start === -1) {
    return new Set();
  }
  let depth = 0;
  for (let i = start + 4; i < text.length; i++) {
    if (text[i] === '{') {
      depth += 1;
    } else if (text[i] === '}') {
      depth -= 1;
      if (depth === 0) {
        const body = text.slice(start + 5, i);
        // Top-level names only: a nested default like `{ a = { b: 1 } }` must not
        // contribute `b`, and `prop: alias` binds the alias, not the key.
        const names = new Set<string>();
        let nesting = 0;
        for (const piece of body.split(',')) {
          const before = nesting;
          nesting += (piece.match(/[{[(]/g) ?? []).length;
          nesting -= (piece.match(/[}\])]/g) ?? []).length;
          if (before !== 0) {
            continue;
          }
          const name = /^\s*(?:\.\.\.)?([A-Za-z_$][\w$]*)/.exec(piece);
          if (name !== null) {
            names.add(name[1]);
          }
        }
        return names;
      }
    }
  }
  return new Set();
};

const isComponentLevelProp = (component: string, prop: string): boolean =>
  destructuredProps(component).has(prop);

/** Is the character at `index` between a `<select …>` open tag and its `</select>`? */
const isInsideSelect = (text: string, index: number): boolean => {
  let depth = 0;
  for (const tag of text.slice(0, index).matchAll(/<select\b|<\/select>/g)) {
    depth += tag[0] === '</select>' ? -1 : 1;
  }
  return depth > 0;
};

/** The `{#snippet name(…)}` block enclosing `index`, or `null` at the template's top level. */
const enclosingSnippet = (text: string, index: number): string | null => {
  let current: string | null = null;
  for (const token of text.slice(0, index).matchAll(/\{#snippet (\w+)\(|\{\/snippet\}/g)) {
    current = token[0] === '{/snippet}' ? null : token[1];
  }
  return current;
};

/**
 * Is every place `prop` renders the content of a native `<select>`?
 *
 * A render site counts when it sits inside `<select>` directly, or inside a snippet
 * whose own render sites all do -- Select wraps `children` in `nativeOptions` so the
 * single and multiple `<select>` branches share it. One level of indirection only, and
 * at least one site: a prop rendered nowhere must not pass by having nothing to check.
 */
const rendersOnlyInsideSelect = (component: string, prop: string): boolean => {
  const text = source(component);
  const sitesOf = (name: string): number[] =>
    [...text.matchAll(new RegExp(`\\{@render\\s+${name}\\s*(?:\\?\\.)?\\s*\\(`, 'g'))].map(
      (m) => m.index
    );
  const sites = sitesOf(prop);
  if (sites.length === 0) {
    return false;
  }
  return sites.every((site) => {
    if (isInsideSelect(text, site)) {
      return true;
    }
    const snippet = enclosingSnippet(text, site);
    if (snippet === null) {
      return false;
    }
    const snippetSites = sitesOf(snippet);
    return snippetSites.length > 0 && snippetSites.every((at) => isInsideSelect(text, at));
  });
};

/**
 * Props left unreachable from markup on purpose, and the shape that makes a named slot
 * the wrong tool. `perItem` means the component renders it once per array entry;
 * `notAComponentProp` means the `Snippet` declaration belongs to an item type in
 * properties.ts rather than to the component's own props; `nativeSelectContent` means
 * it renders as the children of a native `<select>`, which takes its options from its
 * own tree children and ignores anything a `<slot>` projects into it.
 *
 * Re-exported from scripts/wc2-unreachable.mjs rather than declared here a second
 * time, so a decision recorded once has a single home rather than two copies that
 * can silently drift apart.
 */
const NOT_BRIDGED: ReadonlyArray<{
  component: string;
  prop: string;
  shape: 'perItem' | 'notAComponentProp' | 'nativeSelectContent';
  why: string;
}> = WC2_UNREACHABLE;

/**
 * Exposed props whose slot is claimed only when the consumer really filled it, because
 * supplying the snippet does more than choose a glyph. Named here so that dropping the
 * guard is a test failure rather than a silent layout change.
 */
const GUARDED: ReadonlyArray<{ component: Component; slot: string }> = [
  { component: 'Card', slot: 'title-snippet' },
  { component: 'Card', slot: 'description-snippet' },
  { component: 'Card', slot: 'header-right' },
  { component: 'Card', slot: 'footer' },
  { component: 'Combobox', slot: 'input-prefix' },
  { component: 'Combobox', slot: 'input-suffix' },
  { component: 'Combobox', slot: 'empty-snippet' },
  { component: 'Combobox', slot: 'action-icon' },
  { component: 'DateRangePicker', slot: 'time-picker' },
  { component: 'DateRangePicker', slot: 'compare-calendar' },
  { component: 'Input', slot: 'left-icon' },
  { component: 'Input', slot: 'right-icon' },
  { component: 'Input', slot: 'label-suffix' },
  { component: 'Progress', slot: 'leading-label' },
  { component: 'Progress', slot: 'header-start' },
  { component: 'Progress', slot: 'header-end' },
  { component: 'Progress', slot: 'note' },
  // HITL direct-child fill detection is verified with real custom elements in automatic-ui-contracts.test.ts.
  { component: 'Status', slot: 'icon' },
  { component: 'ThinkingIndicator', slot: 'avatar' },
  { component: 'ThinkingIndicator', slot: 'toggle-icon' }
];

/**
 * Snippet props that take arguments but keep a named slot, as the FALLBACK to a snippet
 * assigned as a JS property: the wrapper renders `props.<prop>(...)` WITH the arguments
 * when one is assigned, and projects the slot otherwise. That is the shape
 * scripts/check-wc-contract.js prescribes (Menu's `trigger` is the other example). The slot
 * cannot carry the arguments, so it serves consumers that need none of them, which is every
 * consumer there was before the prop took any.
 *
 * Each entry is re-derived from source below, so dropping the property-assigned branch, or
 * the arguments, fails a test rather than leaving a slot that quietly lost its meaning.
 */
const PARAMETERIZED_WITH_SLOT_FALLBACK: ReadonlyArray<{ component: Component; prop: string }> = [
  { component: 'DateRangePicker', prop: 'compareCalendar' }
];

describe('argument-less content props reachable from markup', () => {
  it.each(WC2_COMPONENTS)('%s: every declared slot names a real snippet prop', (component) => {
    const props = new Set([
      ...argumentlessSnippetProps(component),
      ...PARAMETERIZED_WITH_SLOT_FALLBACK.filter((entry) => entry.component === component).map(
        (entry) => entry.prop
      )
    ]);
    const byKebab = new Map([...props].map((prop) => [kebab(prop), prop]));
    for (const slot of declaredSlots(component)) {
      // A slot whose name is a typo compiles, renders and projects nothing. Nothing else
      // in the suite compares the two spellings -- check-wc-contract.js prints this as
      // one of the things a pass there does not say.
      expect(byKebab.has(slot), `<slot name="${slot}"> in ${component}.wc.svelte`).toBe(true);
    }
  });

  it.each(PARAMETERIZED_WITH_SLOT_FALLBACK)(
    '$component $prop: takes arguments, and its slot is only the fallback to an assigned snippet',
    ({ component, prop }) => {
      const declared = new RegExp(`${prop}\\??\\s*:\\s*Snippet<\\[`);
      expect(read(`src/lib/${component}/properties.ts`)).toMatch(declared);
      const text = wrapper(component);
      expect(text).toMatch(new RegExp(`\\{#snippet ${prop}\\(\\w+\\)\\}`));
      expect(text).toMatch(new RegExp(`\\{@render props\\.${prop}\\(\\w+\\)\\}`));
      expect(declaredSlots(component).has(kebab(prop))).toBe(true);
    }
  );

  it.each(WC2_COMPONENTS)('%s: every declared slot is documented', (component) => {
    const slots = declaredSlots(component);
    if (slots.size === 0) {
      return;
    }
    const page = docs(component);
    expect(page).toContain('### Slots');
    for (const slot of slots) {
      // The Description column is what a consumer reads to learn what renders when they
      // slot nothing, so the row has to exist for every slot the wrapper really has.
      expect(page, `docs/${component}.md`).toContain(`\`${slot}\``);
    }
  });

  it.each(NOT_BRIDGED)('$component.$prop has no slot: $why', ({ component, prop, shape }) => {
    expect(declaredSlots(component).has(kebab(prop))).toBe(false);
    if (shape === 'perItem') {
      expect(readInsideEach(component, prop)).toBe(true);
    } else if (shape === 'nativeSelectContent') {
      // The wrapper must not offer a default slot either: that is the path a
      // `children` prop would otherwise be bridged through.
      expect(wrapper(component)).not.toMatch(/<slot(?![^>]*\bname=)[^>]*>/);
      expect(rendersOnlyInsideSelect(component, prop)).toBe(true);
    } else {
      expect(isComponentLevelProp(component, prop)).toBe(false);
    }
  });

  it.each(GUARDED)('$component keeps $slot fill-aware', ({ component, slot }) => {
    // The guard is what stops the component's own gate being permanently true, which for
    // these props changes padding, draws a divider or turns on behaviour.
    expect(wrapper(component)).toContain(`$host().querySelector('[slot="${slot}"]')`);
  });

  it(
    'no wrapper hoists a slot-bearing snippet out of component scope',
    () => {
      /*
       * The failure this catches produces no build error and no console warning. A
       * `{#snippet}` declared at the TOP LEVEL of a template is hoisted to module scope when
       * it closes over nothing from the instance, but the `<slot>` inside it compiles to
       * `$.slot(node, $$props, …)` -- and `$$props` is a parameter of the component function.
       * The hoisted copy therefore throws `$$props is not defined` the moment it renders, and
       * what a consumer sees is an empty shadow root.
       *
       * Compiling as a custom element and asking where `$.slot(` lands relative to the
       * component function is the whole test: above it means hoisted. Verified to be capable
       * of failing by hoisting a wrapper's snippet to the top level, which reports here and
       * nowhere else in the suite.
       */
      const dir = join(ROOT, 'src/wc/components');
      const hoisted: string[] = [];
      for (const file of readdirSync(dir).filter((name) => name.endsWith('.wc.svelte'))) {
        const js = compile(readFileSync(join(dir, file), 'utf8'), {
          generate: 'client',
          runes: true,
          customElement: true,
          filename: file
        }).js.code;
        const componentFn = js.search(/^export default function /m);
        for (const match of js.matchAll(/\$\.slot\(/g)) {
          if (match.index < componentFn) {
            hoisted.push(file);
          }
        }
      }
      expect(hoisted).toEqual([]);
    },
    REPO_SCAN_TIMEOUT_MS
  );

  it('no bridged slot is rendered per array entry', () => {
    const offenders: string[] = [];
    for (const component of WC2_COMPONENTS) {
      const byKebab = new Map(
        [...argumentlessSnippetProps(component)].map((prop) => [kebab(prop), prop])
      );
      for (const slot of declaredSlots(component)) {
        const prop = byKebab.get(slot);
        if (typeof prop === 'string' && readInsideEach(component, prop)) {
          offenders.push(`${component}.${prop} (slot="${slot}")`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
