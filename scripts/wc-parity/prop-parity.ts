import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'svelte/compiler';

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
  // `children` is the costliest of these and was measured, not reasoned about:
  // declaring it does not merely shadow `Element.children`, it leaves
  // `element.children` returning undefined outright, so `el.children.length`
  // throws on every wrapper that declared it. Light-DOM content reaches the
  // component through the default `<slot>`, which is unaffected — that is the
  // path web-component consumers actually use, so nothing is lost by reserving
  // the name.
  'children',
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

export type WrapperParity = {
  readonly wrapper: string;
  readonly tag: string | null;
  readonly declared: readonly string[];
  readonly missing: readonly string[];
  readonly reserved: readonly string[];
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
      results.push({ wrapper, tag, declared: props, missing: [], reserved: [] });
      continue;
    }

    const component = readComponentProps(readFileSync(componentPath, 'utf8'));
    const declared = new Set(props);
    const absent = component.hasRest ? [] : component.names.filter((name) => !declared.has(name));

    results.push({
      wrapper,
      tag,
      declared: props,
      missing: absent.filter((name) => !HOST_RESERVED_PROPS.has(name)),
      reserved: absent.filter((name) => HOST_RESERVED_PROPS.has(name))
    });
  }
  return results;
}
