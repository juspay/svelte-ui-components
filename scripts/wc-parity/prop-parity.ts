import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'svelte/compiler';
import {
  CALLBACK_PROP_PATTERN,
  DISPATCH_COLLISION_EXCEPTIONS
} from './dispatch-collision-exceptions.js';
import { HOST_EVENT_HANDLER_PROPS } from './host-event-handler-props.js';

/**
 * Shared between the unit guard (source declarations match component props) and
 * the integration proof (the built custom elements really expose them). Kept out
 * of `src/lib`, so it is never packaged for consumers.
 */

const WC_DIR = join(process.cwd(), 'src/wc/components');
const LIB_ROOT = join(process.cwd(), 'src');

type UnknownRecord = Record<string, unknown>;

/**
 * Reads an unknown value as a record of unknown fields, matching the idiom in
 * scripts/migrate/analyze.ts. Type assertions and predicates are banned
 * repo-wide, so the own enumerable keys are copied rather than the type asserted.
 */
function asRecord(value: unknown): UnknownRecord {
  if (typeof value !== 'object' || value === null) {
    return {};
  }
  const record: UnknownRecord = {};
  for (const key of Object.keys(value)) {
    Object.defineProperty(record, key, {
      value: Reflect.get(value, key),
      enumerable: true,
      writable: true,
      configurable: true
    });
  }
  return record;
}

function asList(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

/** An estree property key is either `name` (Identifier) or `value` (Literal). */
function keyName(node: unknown): string | null {
  const key = asRecord(asRecord(node).key);
  if (typeof key.name === 'string') {
    return key.name;
  }
  return typeof key.value === 'string' ? key.value : null;
}

/**
 * `customElement={{ ... }}` is a single quoted expression, which Svelte's modern
 * AST hands back either as an ExpressionTag or as a one-element array holding
 * one. Both spellings mean the same thing here.
 */
function expressionOf(attributeValue: unknown): unknown {
  const single = Array.isArray(attributeValue) ? attributeValue[0] : attributeValue;
  return asRecord(single).expression;
}

export type CustomElementDeclaration = {
  readonly tag: string | null;
  readonly props: readonly string[];
};

export function readCustomElementDeclaration(source: string): CustomElementDeclaration {
  const root = asRecord(parse(source, { modern: true }));
  const options = asRecord(root.options);
  for (const attribute of asList(options.attributes)) {
    const record = asRecord(attribute);
    if (record.name !== 'customElement') {
      continue;
    }
    const object = asRecord(expressionOf(record.value));
    let tag: string | null = null;
    const props: string[] = [];
    for (const property of asList(object.properties)) {
      const name = keyName(property);
      const value = asRecord(asRecord(property).value);
      if (name === 'tag' && typeof value.value === 'string') {
        tag = value.value;
      }
      if (name === 'props') {
        for (const declared of asList(value.properties)) {
          const propName = keyName(declared);
          if (propName !== null) {
            props.push(propName);
          }
        }
      }
    }
    return { tag, props };
  }
  return { tag: null, props: [] };
}

export type ComponentProps = {
  readonly names: readonly string[];
  /** A rest element forwards everything, so parity is automatic. */
  readonly hasRest: boolean;
};

export function readComponentProps(source: string): ComponentProps {
  const root = asRecord(parse(source, { modern: true }));
  const program = asRecord(asRecord(root.instance).content);
  for (const statement of asList(program.body)) {
    const node = asRecord(statement);
    if (node.type !== 'VariableDeclaration') {
      continue;
    }
    for (const declarator of asList(node.declarations)) {
      const declared = asRecord(declarator);
      const init = asRecord(declared.init);
      if (init.type !== 'CallExpression' || asRecord(init.callee).name !== '$props') {
        continue;
      }
      const id = asRecord(declared.id);
      if (id.type !== 'ObjectPattern') {
        continue;
      }
      const names: string[] = [];
      let hasRest = false;
      for (const property of asList(id.properties)) {
        if (asRecord(property).type === 'RestElement') {
          hasRest = true;
          continue;
        }
        const name = keyName(property);
        if (name !== null) {
          names.push(name);
        }
      }
      return { names, hasRest };
    }
  }
  return { names: [], hasRest: false };
}

/**
 * A wrapper may expose a component prop under a different name — `id` and
 * `ariaLabel` collide with host accessors, and `ariaLabelledby` follows the same
 * `input-*` convention so the host's own `aria-labelledby` keeps its meaning. The
 * wrapper then declares `inputAriaLabelledby` and renders
 * `<Toggle ariaLabelledby={inputAriaLabelledby} />`. Parity holds when the
 * component attribute is bound to an identifier the wrapper declares, so this
 * collects those attribute names. A bound identifier that is NOT a declared prop
 * is not forwarding anything a consumer can set, and stays missing.
 */
/**
 * The declared names that a wrapper actually USES as a forwarding source.
 *
 * `readForwardedProps` answers "which component prop is satisfied by a rename",
 * which is the direction parity has always checked. This answers the opposite
 * question -- "is this declared prop wired to anything at all" -- and the two are
 * not the same set: the first collects `ariaLabel`, this one collects
 * `checkboxAriaLabel`.
 */
export function readRenameSources(source: string, declared: ReadonlySet<string>): string[] {
  const sources: string[] = [];
  // A GENERIC descent, not `fragment.nodes` / `nodes` like `readForwardedProps`.
  // That shape cannot enter an `{#if}`: an IfBlock holds its children under
  // `consequent` and `alternate`, so a `<Chat {...props} title={chatTitle}>`
  // inside a branch is invisible to it. Six wrappers render their component
  // that way and every one looked unwired until this walked the whole tree.
  //
  // The existing rule never noticed because the names it loses are all in
  // HOST_RESERVED_PROPS, and those are reported separately from `missing`. This
  // rule asks the opposite question, where a missed forwarding would accuse a
  // correctly-wired prop of being dead -- so it has to see every branch.
  const visit = (node: unknown): void => {
    if (node === null || typeof node !== 'object') {
      return;
    }
    if (Array.isArray(node)) {
      for (const child of node) {
        visit(child);
      }
      return;
    }
    const record = asRecord(node);
    if (record.type === 'Component') {
      // Every declared identifier ANYWHERE inside an attribute's expression, not
      // just a bare `prop={declaredName}`. Slider binds
      // `ariaLabel={sliderAriaLabel ?? referencedLabel}` -- a LogicalExpression --
      // and reading only the top-level node called a correctly-wired prop dead.
      // The question here is "is this wired to anything at all", so any mention
      // inside the binding answers it.
      collectIdentifiers(record.attributes, declared, sources);
    }
    for (const value of Object.values(record)) {
      visit(value);
    }
  };
  visit(parse(source, { modern: true }));
  return sources;
}

function collectIdentifiers(node: unknown, declared: ReadonlySet<string>, into: string[]): void {
  if (node === null || typeof node !== 'object') {
    return;
  }
  if (Array.isArray(node)) {
    for (const child of node) {
      collectIdentifiers(child, declared, into);
    }
    return;
  }
  const record = asRecord(node);
  if (
    record.type === 'Identifier' &&
    typeof record.name === 'string' &&
    declared.has(record.name)
  ) {
    into.push(record.name);
  }
  for (const value of Object.values(record)) {
    collectIdentifiers(value, declared, into);
  }
}

export function readForwardedProps(source: string, declared: ReadonlySet<string>): string[] {
  const root = asRecord(parse(source, { modern: true }));
  const forwarded: string[] = [];
  const visit = (node: unknown): void => {
    const record = asRecord(node);
    if (record.type === 'Component') {
      for (const attribute of asList(record.attributes)) {
        const attributeRecord = asRecord(attribute);
        if (attributeRecord.type !== 'Attribute' || typeof attributeRecord.name !== 'string') {
          continue;
        }
        const expression = asRecord(expressionOf(attributeRecord.value));
        if (
          expression.type === 'Identifier' &&
          typeof expression.name === 'string' &&
          declared.has(expression.name) &&
          expression.name !== attributeRecord.name
        ) {
          forwarded.push(attributeRecord.name);
        }
      }
    }
    for (const child of asList(asRecord(record.fragment).nodes)) {
      visit(child);
    }
    for (const child of asList(record.nodes)) {
      visit(child);
    }
  };
  visit(root.fragment);
  return forwarded;
}

/** Resolves the `$lib/...` import a wrapper renders back to a file on disk. */
export function wrappedComponentPath(source: string): string | null {
  const root = asRecord(parse(source, { modern: true }));
  const program = asRecord(asRecord(root.instance).content);
  for (const statement of asList(program.body)) {
    const node = asRecord(statement);
    if (node.type !== 'ImportDeclaration') {
      continue;
    }
    const specifier = asRecord(node.source).value;
    if (typeof specifier === 'string' && specifier.startsWith('$lib/')) {
      return join(LIB_ROOT, specifier.replace('$lib/', 'lib/'));
    }
  }
  return null;
}

/**
 * Names that already exist on `HTMLElement` or are ARIA-reflected. Declaring one
 * as a custom-element prop replaces the host's own accessor — `title` stops
 * being the native tooltip, `role` stops reflecting to assistive tech. A wrapper
 * that needs to forward one of these has to expose it under a different name, so
 * these are excluded from the parity requirement rather than silently declared.
 */
export const HOST_RESERVED_PROPS: ReadonlySet<string> = new Set([
  'id',
  'title',
  'role',
  'style',
  'class',
  'slot',
  'part',
  'dir',
  'lang',
  'hidden',
  'tabindex',
  // Worse than a shadowed accessor: Svelte's custom-element layer iterates
  // `this.attributes` when syncing attributes onto props, so a wrapper declaring it
  // threw during render and `<sui-checkbox>` produced an empty shadow root for every
  // consumer. Missed when this list was enumerated because the sweep asked for
  // ARIAMixin names and `on*` handlers, not for every accessor on Element.
  'attributes',
  // `children` is the costliest of these and was measured, not reasoned about:
  // declaring it does not merely shadow `Element.children`, it leaves
  // `element.children` returning undefined outright, so `el.children.length`
  // throws on every wrapper that declared it. Light-DOM content reaches the
  // component through the default `<slot>`, which is unaffected — that is the
  // path web-component consumers actually use, so nothing is lost by reserving
  // the name.
  'children',
  // Same class as `children`, and measured the same way rather than reasoned
  // about: `Element.prototype.attributes` is the live NamedNodeMap that Svelte's
  // own generated `connectedCallback` iterates (`for (const attr of this.attributes)`).
  // Declaring a prop of that name replaced it with a plain object, so every
  // `<sui-checkbox>` threw `TypeError: this.attributes is not iterable` on connect
  // and never initialised -- reproduced in Chromium with a bare
  // `document.createElement('sui-checkbox')`. A wrapper that needs to forward it
  // exposes it under another name, as Checkbox.wc.svelte now does.
  'attributes',
  // ARIAMixin is implemented on Element, so each of these is already an accessor
  // that reflects to its aria-* attribute. Verified in Chromium rather than
  // assumed: every name below answered true to `name in Element.prototype`.
  // `ariaHaspopup` — lowercase p, the spelling this library actually uses — is
  // NOT one of them (the reflected name is `ariaHasPopup`), so it stays
  // declarable. That one letter is the whole difference. Declarable is not the
  // same as working, though: Svelte derives the observed attribute by
  // lowercasing, so any aria* prop declared here needs an explicit
  // `attribute: 'aria-…'` or the attribute never reaches it.
  'ariaLabel',
  'ariaSelected',
  'ariaBusy',
  'ariaChecked',
  'ariaExpanded',
  'ariaHidden',
  'ariaPressed',
  'ariaDisabled',
  'ariaCurrent',
  'ariaHasPopup',
  'ariaLive',
  'ariaModal',
  'ariaValueNow',
  'ariaValueMax',
  'ariaValueMin',
  'ariaValueText',
  'ariaRoleDescription'
]);

// The authoritative collision set: every existing DOM event-handler IDL
// attribute on HTMLElement's prototype chain. Lives in its own dependency-free
// file because src/wc/dispatch.ts (bundled for browsers) needs it too, and this
// module's node:fs/svelte-compiler imports can never reach that bundle. See
// host-event-handler-props.ts for the full reasoning and the enumeration itself.
//
// The '.js' specifier (not '.ts', not extensionless) is the one spelling every
// program that reaches this file agrees on: this module is also imported (for
// prop-parity checks) by tests/wc-prop-parity.spec.ts and
// tests/wc-event-casing-parity.spec.ts, which pulls it into ./tsconfig.json's
// (root) program even though it sits outside that config's own `include` --
// and root's `moduleResolution: "Node"` rejects a literal '.ts' extension
// (TS2835-adjacent) the moment `allowImportingTsExtensions` is unset, while
// this file's own tsconfig.json (`moduleResolution: "NodeNext"`) rejects an
// extensionless specifier outright (TS2835) and only accepts '.js' or a
// literal '.ts' (via `allowImportingTsExtensions`). '.js' is the only one of
// the three spellings both configs accept -- the standard NodeNext convention
// of writing the specifier as it will resolve at runtime, which TS maps back
// to the co-located `.ts` source file. Confirmed empirically against both
// `npx tsc -p scripts/wc-parity/tsconfig.json` and
// `svelte-check --tsconfig ./tsconfig.json`.
export { HOST_EVENT_HANDLER_PROPS } from './host-event-handler-props.js';

// Re-exported so prop-parity.test.ts's gate can assert against the exact
// same pattern and exception map dispatch.ts runs on -- one constant each, not a
// gate-side re-derivation that could silently diverge from the browser bundle's.
export { CALLBACK_PROP_PATTERN, DISPATCH_COLLISION_EXCEPTIONS };

export type WrapperParity = {
  readonly wrapper: string;
  readonly tag: string | null;
  readonly declared: readonly string[];
  readonly missing: readonly string[];
  readonly reserved: readonly string[];
  /** Declared on the element but wired to nothing on the component. */
  readonly dead: readonly string[];
};

export function readWrapperParity(): readonly WrapperParity[] {
  const results: WrapperParity[] = [];
  for (const wrapper of readdirSync(WC_DIR)
    .filter((file) => file.endsWith('.wc.svelte'))
    .sort()) {
    const source = readFileSync(join(WC_DIR, wrapper), 'utf8');
    const { tag, props } = readCustomElementDeclaration(source);
    const componentPath = wrappedComponentPath(source);
    if (componentPath === null) {
      results.push({ wrapper, tag, declared: props, missing: [], reserved: [], dead: [] });
      continue;
    }

    const component = readComponentProps(readFileSync(componentPath, 'utf8'));
    const declared = new Set(props);
    const forwarded = new Set(readForwardedProps(source, declared));
    const absent = component.hasRest
      ? []
      : component.names.filter((name) => !declared.has(name) && !forwarded.has(name));

    // The opposite direction. Everything above asks "is every component prop
    // declared on the element"; this asks "does every declared prop reach the
    // component at all". A name that is neither a prop of the wrapped component
    // nor mentioned in any binding to it is wired to nothing: the element hands
    // a consumer an accessor, takes the value, and drops it without an error.
    // `<sui-stepper>` shipped exactly that -- `onstepclick`, the deprecated alias
    // 4.0.0 deleted from StepperProperties, left behind on the element.
    const renamed = new Set(readRenameSources(source, declared));
    const componentNames = new Set(component.names);

    results.push({
      wrapper,
      tag,
      declared: props,
      missing: absent.filter((name) => !HOST_RESERVED_PROPS.has(name)),
      reserved: absent.filter((name) => HOST_RESERVED_PROPS.has(name)),
      dead: props.filter((name) => !componentNames.has(name) && !renamed.has(name))
    });
  }
  return results;
}

// ---------------------------------------------------------------------------
// A declared callback prop dispatches a same-named DOM CustomEvent unless
// its name collides with a native HTMLElement handler (HOST_EVENT_HANDLER_PROPS).
// src/wc/dispatch.ts is the shared runtime mechanism; what follows is the static
// reader that tells whether a given wrapper's SOURCE actually wires it, the same
// "read the declaration, don't run the component" method the rest of this file
// uses for prop parity.
// ---------------------------------------------------------------------------

/**
 * The identifier a wrapper's own `let ... = $props()` binds -- either the whole
 * object (`let props = $props()`) or a rest element inside a destructure
 * (`let { x, ...props } = $props()`, e.g. Checkbox.wc.svelte). This is the
 * wrapper's OWN props bag, not the wrapped library component's (readComponentProps
 * reads that one, off a different file). `null` means the wrapper never binds one
 * as a single spreadable identifier -- dispatchEvents has nothing to receive.
 */
function wrapperPropsBindingName(source: string): string | null {
  const root = asRecord(parse(source, { modern: true }));
  const program = asRecord(asRecord(root.instance).content);
  for (const statement of asList(program.body)) {
    const node = asRecord(statement);
    if (node.type !== 'VariableDeclaration') {
      continue;
    }
    for (const declarator of asList(node.declarations)) {
      const declared = asRecord(declarator);
      const init = asRecord(declared.init);
      if (init.type !== 'CallExpression' || asRecord(init.callee).name !== '$props') {
        continue;
      }
      const id = asRecord(declared.id);
      if (id.type === 'Identifier' && typeof id.name === 'string') {
        return id.name;
      }
      if (id.type === 'ObjectPattern') {
        for (const property of asList(id.properties)) {
          const propertyRecord = asRecord(property);
          if (propertyRecord.type !== 'RestElement') {
            continue;
          }
          const argument = asRecord(propertyRecord.argument);
          if (typeof argument.name === 'string') {
            return argument.name;
          }
        }
      }
    }
  }
  return null;
}

/** The identifier a wrapper's own `const ... = $host()` binds, or `null`. */
function hostElBindingName(source: string): string | null {
  const root = asRecord(parse(source, { modern: true }));
  const program = asRecord(asRecord(root.instance).content);
  for (const statement of asList(program.body)) {
    const node = asRecord(statement);
    if (node.type !== 'VariableDeclaration') {
      continue;
    }
    for (const declarator of asList(node.declarations)) {
      const declared = asRecord(declarator);
      const init = asRecord(declared.init);
      const id = asRecord(declared.id);
      if (
        init.type === 'CallExpression' &&
        asRecord(init.callee).name === '$host' &&
        id.type === 'Identifier' &&
        typeof id.name === 'string'
      ) {
        return id.name;
      }
    }
  }
  return null;
}

type DispatchHelperCall = {
  /** The import specifier `dispatchEvents` was imported from, or `null` if never imported. */
  readonly importedFrom: string | null;
  /** The identifier the call's result was assigned to, e.g. `dispatchers`. */
  readonly dispatcherVarName: string | null;
  /** Identifier names of the call's own arguments, in order -- `[]` if not called, or if called with a non-identifier argument. */
  readonly callArgNames: readonly string[];
  /**
   * Whether the call is wrapped in `$derived(...)`, which the dispatch rule requires.
   *
   * Not cosmetic. `dispatchEvents` omits a dispatcher for a presence-gated callback
   * until the consumer has assigned it (see presence-gated-callbacks.ts), and it reads
   * `props` to decide. Called once, that decision freezes at first render and a
   * consumer who assigns the callback later never gets the control at all.
   */
  readonly reactive: boolean;
};

const EMPTY_DISPATCH_HELPER_CALL: DispatchHelperCall = {
  importedFrom: null,
  dispatcherVarName: null,
  callArgNames: [],
  reactive: false
};

/**
 * Finds `import { dispatchEvents } from '<relative path>'` (under whatever local
 * name it was imported as -- there is no reason to rename it today, but nothing
 * requires the alias) and the one place its result is assigned to a variable.
 * Reading the CALL's arguments as plain identifier names (rather than resolving
 * what they hold) is deliberate: `isWc4DispatchWired` below only needs to confirm
 * they are the SAME identifiers `$host()`/`$props()` were bound to, which is a
 * name comparison, not a values-flow analysis this file has no need to build.
 */
function readDispatchHelperCall(source: string): DispatchHelperCall {
  const root = asRecord(parse(source, { modern: true }));
  const program = asRecord(asRecord(root.instance).content);

  let localName: string | null = null;
  let importedFrom: string | null = null;
  for (const statement of asList(program.body)) {
    const node = asRecord(statement);
    if (node.type !== 'ImportDeclaration') {
      continue;
    }
    const sourceValue = asRecord(node.source).value;
    for (const specifier of asList(node.specifiers)) {
      const specifierRecord = asRecord(specifier);
      if (
        specifierRecord.type === 'ImportSpecifier' &&
        asRecord(specifierRecord.imported).name === 'dispatchEvents'
      ) {
        const local = asRecord(specifierRecord.local);
        if (typeof local.name === 'string') {
          localName = local.name;
          importedFrom = typeof sourceValue === 'string' ? sourceValue : null;
        }
      }
    }
  }
  if (localName === null) {
    return EMPTY_DISPATCH_HELPER_CALL;
  }

  for (const statement of asList(program.body)) {
    const node = asRecord(statement);
    if (node.type !== 'VariableDeclaration') {
      continue;
    }
    for (const declarator of asList(node.declarations)) {
      const declared = asRecord(declarator);
      const init = asRecord(declared.init);
      // `$derived(dispatchEvents(...))` is the required shape, so the helper call sits
      // one level down. Unwrap exactly one `$derived` rather than searching, so an
      // unwrapped call is still found and reported as non-reactive instead of missing.
      const reactive = init.type === 'CallExpression' && asRecord(init.callee).name === '$derived';
      const call = reactive ? asRecord(asList(init.arguments)[0]) : init;
      if (call.type !== 'CallExpression' || asRecord(call.callee).name !== localName) {
        continue;
      }
      const id = asRecord(declared.id);
      const callArgNames = asList(call.arguments).map((argument) => {
        const argumentRecord = asRecord(argument);
        return typeof argumentRecord.name === 'string' ? argumentRecord.name : '';
      });
      return {
        importedFrom,
        dispatcherVarName: id.type === 'Identifier' && typeof id.name === 'string' ? id.name : null,
        callArgNames,
        reactive
      };
    }
  }
  // Imported but never assigned to a variable: reactive is false because there is no
  // call to have wrapped.
  return { importedFrom, dispatcherVarName: null, callArgNames: [], reactive: false };
}

/** The local binding name of the wrapped `$lib/...` component, e.g. `BarChart`. */
function wrappedComponentLocalName(source: string): string | null {
  const root = asRecord(parse(source, { modern: true }));
  const program = asRecord(asRecord(root.instance).content);
  for (const statement of asList(program.body)) {
    const node = asRecord(statement);
    if (node.type !== 'ImportDeclaration') {
      continue;
    }
    const sourceValue = asRecord(node.source).value;
    if (typeof sourceValue !== 'string' || !sourceValue.startsWith('$lib/')) {
      continue;
    }
    for (const specifier of asList(node.specifiers)) {
      const specifierRecord = asRecord(specifier);
      if (specifierRecord.type === 'ImportDefaultSpecifier') {
        const local = asRecord(specifierRecord.local);
        if (typeof local.name === 'string') {
          return local.name;
        }
      }
    }
  }
  return null;
}

/**
 * Fields whose value is itself a Fragment (`{ nodes: [...] }`) in Svelte's modern
 * template AST: a Component/element's own children, and both arms of an
 * `{#if}...{:else}...{/if}` (BarChart.wc.svelte renders the wrapped component from
 * both). Walking exactly these four -- confirmed empirically against the parsed
 * AST, not assumed -- is what lets `componentSpreadIdentifierSites` find a render
 * site regardless of which conditional branch it sits in.
 */
const FRAGMENT_HOLDING_FIELDS = ['fragment', 'consequent', 'alternate', 'body'] as const;

/**
 * For every `<ComponentLocalName ...>` tag in the template, the identifier names
 * of its spread attributes (`{...x}`), in source order. One entry per render
 * site -- a wrapper that renders the wrapped component from more than one branch
 * (BarChart's `{#if hasEmptySlot}`) yields more than one entry, and
 * `isWc4DispatchWired` requires the ordering property to hold at EVERY one, not
 * just the first found.
 */
function componentSpreadIdentifierSites(
  source: string,
  componentLocalName: string
): readonly (readonly string[])[] {
  const root = asRecord(parse(source, { modern: true }));
  const sites: string[][] = [];

  const visit = (node: unknown): void => {
    const record = asRecord(node);
    if (record.type === 'Component' && record.name === componentLocalName) {
      const names: string[] = [];
      for (const attribute of asList(record.attributes)) {
        const attributeRecord = asRecord(attribute);
        if (attributeRecord.type !== 'SpreadAttribute') {
          continue;
        }
        const expression = asRecord(attributeRecord.expression);
        if (typeof expression.name === 'string') {
          names.push(expression.name);
        }
      }
      sites.push(names);
    }
    for (const field of FRAGMENT_HOLDING_FIELDS) {
      for (const child of asList(asRecord(record[field]).nodes)) {
        visit(child);
      }
    }
  };

  for (const node of asList(asRecord(root.fragment).nodes)) {
    visit(node);
  }
  return sites;
}

/**
 * Whether a wrapper's SOURCE structurally wires the dispatch rule: imports `dispatchEvents`
 * from a relative `dispatch` module, calls it with exactly the wrapper's own
 * `$host()` and `$props()` bindings (by name -- see readDispatchHelperCall's
 * note), and spreads the call's result onto EVERY render of the wrapped
 * component strictly after that same props binding is spread.
 *
 * That last ordering check is load-bearing, not cosmetic: `{...dispatchers}
 * {...props}` (dispatchers first) would let the plain callback in `props`
 * overwrite the wrapping function for every key they share, silently producing
 * a wrapper that still calls the consumer's callback but never dispatches --
 * the exact regression negative-control (a) in prop-parity's callback-dispatch
 * describe block below demonstrates.
 *
 * This does not re-derive WHICH declared props dispatch versus stay
 * callback-only -- dispatchEvents (src/wc/dispatch.ts) decides that generically,
 * for every wrapper, from HOST_EVENT_HANDLER_PROPS and
 * DISPATCH_COLLISION_EXCEPTIONS alike, and its own unit tests
 * (src/wc/dispatch.test.ts) already cover that logic in isolation. Confirming
 * the wiring below is what makes those guarantees actually apply to THIS
 * wrapper's callback props.
 */
function isWc4DispatchWired(source: string): boolean {
  const hostElName = hostElBindingName(source);
  const propsName = wrapperPropsBindingName(source);
  const dispatchCall = readDispatchHelperCall(source);
  const dispatcherVarName = dispatchCall.dispatcherVarName;
  const importedFrom = dispatchCall.importedFrom;

  if (
    hostElName === null ||
    propsName === null ||
    dispatcherVarName === null ||
    importedFrom === null
  ) {
    return false;
  }
  if (!/(^|\/)dispatch(\.ts|\.js)?$/.test(importedFrom)) {
    return false;
  }
  if (
    dispatchCall.callArgNames.length !== 2 ||
    dispatchCall.callArgNames[0] !== hostElName ||
    dispatchCall.callArgNames[1] !== propsName
  ) {
    return false;
  }
  // Must be `$derived(...)`. A bare call freezes the dispatcher set at first render,
  // which silently costs every presence-gated callback its late assignment.
  if (!dispatchCall.reactive) {
    return false;
  }

  const wrappedLocalName = wrappedComponentLocalName(source);
  if (wrappedLocalName === null) {
    return false;
  }

  const sites = componentSpreadIdentifierSites(source, wrappedLocalName);
  if (sites.length === 0) {
    return false;
  }
  return sites.every((attributeNames) => {
    const propsIndex = attributeNames.indexOf(propsName);
    const dispatchersIndex = attributeNames.indexOf(dispatcherVarName);
    return propsIndex !== -1 && dispatchersIndex !== -1 && dispatchersIndex > propsIndex;
  });
}

export type WrapperDispatchParity = {
  readonly wrapper: string;
  readonly tag: string | null;
  /** Every declared prop matching CALLBACK_PROP_PATTERN, regardless of collision. */
  readonly callbackProps: readonly string[];
  /** Callback props required to dispatch: non-colliding, or colliding-but-excepted. */
  readonly dispatchable: readonly string[];
  /** Colliding callback props with no recorded exception -- must NEVER dispatch. */
  readonly callbackOnly: readonly string[];
  /** Structural wiring found in source. Vacuously true when callbackProps is empty. */
  readonly wired: boolean;
};

export function readDispatchParity(): readonly WrapperDispatchParity[] {
  const results: WrapperDispatchParity[] = [];
  for (const wrapper of readdirSync(WC_DIR)
    .filter((file) => file.endsWith('.wc.svelte'))
    .sort()) {
    const source = readFileSync(join(WC_DIR, wrapper), 'utf8');
    const { tag, props } = readCustomElementDeclaration(source);
    const callbackProps = props.filter((name) => CALLBACK_PROP_PATTERN.test(name));
    const dispatchable = callbackProps.filter(
      (name) =>
        !HOST_EVENT_HANDLER_PROPS.has(name) ||
        DISPATCH_COLLISION_EXCEPTIONS.has(`${tag ?? ''}:${name}`)
    );
    const dispatchableSet = new Set(dispatchable);
    const callbackOnly = callbackProps.filter((name) => !dispatchableSet.has(name));

    results.push({
      wrapper,
      tag,
      callbackProps,
      dispatchable,
      callbackOnly,
      wired: callbackProps.length === 0 ? true : isWc4DispatchWired(source)
    });
  }
  return results;
}
