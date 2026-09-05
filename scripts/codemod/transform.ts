import { parse } from 'svelte/compiler';
import type { AST } from 'svelte/compiler';
import { legacyRenameTable, legacyProps } from './legacy-pairs.ts';

export const SUI_PACKAGE = '@juspay/svelte-ui-components';

export type TransformWarning = {
  readonly file: string;
  readonly line: number;
  readonly column: number;
  readonly message: string;
};

export type TransformResult = {
  readonly code: string;
  readonly changed: boolean;
  readonly propsRenamed: number;
  readonly warnings: ReadonlyArray<TransformWarning>;
};

/**
 * How imports are attributed to this library. The defaults describe a
 * consumer (`@juspay/svelte-ui-components` specifiers, no default imports);
 * this repository's own migration script overrides both so a `$lib/X/X.svelte`
 * default import counts as component `X`.
 */
export type TransformOptions = {
  readonly isLibraryImport?: (specifier: string) => boolean;
  readonly defaultImportComponent?: (specifier: string) => string | null;
};

type Edit = { readonly start: number; readonly end: number; readonly text: string };

type Program = AST.Script['content'];
type LibraryElement = AST.Component | AST.SvelteComponent;

/**
 * estree nodes inside `<script>` are not typed with offsets, but the acorn
 * parser svelte uses attaches them at runtime; recover them by narrowing.
 */
function rangeOf(node: object): { readonly start: number; readonly end: number } | null {
  if (
    'start' in node &&
    typeof node.start === 'number' &&
    'end' in node &&
    typeof node.end === 'number'
  ) {
    return { start: node.start, end: node.end };
  }
  return null;
}

function positionOf(source: string, offset: number): { line: number; column: number } {
  const before = source.slice(0, offset);
  const line = (before.match(/\n/g) ?? []).length + 1;
  return { line, column: offset - before.lastIndexOf('\n') };
}

function applyEdits(source: string, edits: ReadonlyArray<Edit>): string {
  const ordered = [...edits].sort((a, b) => b.start - a.start);
  return ordered.reduce(
    (code, edit) => code.slice(0, edit.start) + edit.text + code.slice(edit.end),
    source
  );
}

type Binding =
  | { readonly kind: 'component'; readonly exported: string }
  | { readonly kind: 'namespace' }
  | { readonly kind: 'other' };

type Scan = {
  readonly edits: Edit[];
  readonly warnings: TransformWarning[];
  readonly bindings: Map<string, Binding>;
  importsLibrary: boolean;
  propsRenamed: number;
};

function isPackageSpecifier(specifier: string): boolean {
  return specifier === SUI_PACKAGE || specifier.startsWith(`${SUI_PACKAGE}/`);
}

type Resolver = Required<TransformOptions>;

function resolverFor(options: TransformOptions): Resolver {
  return {
    isLibraryImport: options.isLibraryImport ?? isPackageSpecifier,
    defaultImportComponent: options.defaultImportComponent ?? (() => null)
  };
}

function scanScript(
  source: string,
  file: string,
  program: Program,
  resolver: Resolver,
  scan: Scan
): void {
  for (const statement of program.body) {
    if (statement.type !== 'ImportDeclaration') {
      continue;
    }
    const specifier = typeof statement.source.value === 'string' ? statement.source.value : '';
    const fromLibrary = resolver.isLibraryImport(specifier);
    if (fromLibrary) {
      scan.importsLibrary = true;
    }
    for (const spec of statement.specifiers) {
      if (spec.type === 'ImportSpecifier') {
        const exported =
          spec.imported.type === 'Identifier'
            ? spec.imported.name
            : typeof spec.imported.value === 'string'
              ? spec.imported.value
              : null;
        scan.bindings.set(
          spec.local.name,
          fromLibrary && exported !== null ? { kind: 'component', exported } : { kind: 'other' }
        );
      } else if (spec.type === 'ImportNamespaceSpecifier') {
        scan.bindings.set(spec.local.name, fromLibrary ? { kind: 'namespace' } : { kind: 'other' });
      } else {
        const component = fromLibrary ? resolver.defaultImportComponent(specifier) : null;
        scan.bindings.set(
          spec.local.name,
          component !== null ? { kind: 'component', exported: component } : { kind: 'other' }
        );
        if (fromLibrary && component === null) {
          const at = positionOf(source, rangeOf(spec)?.start ?? 0);
          scan.warnings.push({
            file,
            line: at.line,
            column: at.column,
            message: `default import from '${specifier}' cannot be resolved to a component; its usages are not rewritten`
          });
        }
      }
    }
  }
}

type Resolution =
  | { readonly kind: 'library'; readonly component: string }
  | { readonly kind: 'other' }
  | { readonly kind: 'unresolved' };

function resolveTag(tagName: string, bindings: ReadonlyMap<string, Binding>): Resolution {
  const segments = tagName.split('.');
  const head = segments.at(0);
  if (typeof head !== 'string' || head.length === 0) {
    return { kind: 'unresolved' };
  }
  const binding = bindings.get(head) ?? null;
  if (binding === null) {
    return { kind: 'unresolved' };
  }
  if (segments.length === 1) {
    return binding.kind === 'component'
      ? { kind: 'library', component: binding.exported }
      : { kind: 'other' };
  }
  const member = segments.at(1);
  if (segments.length === 2 && binding.kind === 'namespace' && typeof member === 'string') {
    return { kind: 'library', component: member };
  }
  return { kind: 'other' };
}

function resolveThisExpression(
  expression: AST.SvelteComponent['expression'],
  bindings: ReadonlyMap<string, Binding>
): Resolution {
  if (expression.type === 'Identifier') {
    return resolveTag(expression.name, bindings);
  }
  if (
    expression.type === 'MemberExpression' &&
    !expression.computed &&
    expression.object.type === 'Identifier' &&
    expression.property.type === 'Identifier'
  ) {
    return resolveTag(`${expression.object.name}.${expression.property.name}`, bindings);
  }
  return { kind: 'unresolved' };
}

function renameAttributes(
  source: string,
  file: string,
  tagLabel: string,
  component: string,
  element: LibraryElement,
  table: ReadonlyMap<string, string> | null,
  scan: Scan
): void {
  if (table === null) {
    return;
  }
  const presentNames = new Set<string>();
  for (const attribute of element.attributes) {
    if (attribute.type === 'Attribute') {
      presentNames.add(attribute.name);
    }
  }
  for (const attribute of element.attributes) {
    if (attribute.type === 'SpreadAttribute') {
      const at = positionOf(source, attribute.start);
      const renameable = [...table.keys()].sort().join(', ');
      scan.warnings.push({
        file,
        line: at.line,
        column: at.column,
        message: `spread attribute on <${tagLabel}> (${component}) may carry renamed props (${renameable}) — not rewritten, review manually`
      });
      continue;
    }
    if (attribute.type !== 'Attribute') {
      continue;
    }
    const target = table.get(attribute.name) ?? null;
    if (target === null) {
      continue;
    }
    if (presentNames.has(target)) {
      const at = positionOf(source, attribute.start);
      scan.warnings.push({
        file,
        line: at.line,
        column: at.column,
        message: `target prop '${target}' already present on <${tagLabel}> (${component}); '${attribute.name}' left as-is — review manually`
      });
      continue;
    }
    if (source.charAt(attribute.start) === '{') {
      // Shorthand `{prop}`: expand to `newName={prop}`, keeping the local identifier.
      scan.edits.push({
        start: attribute.start,
        end: attribute.end,
        text: `${target}={${attribute.name}}`
      });
      scan.propsRenamed += 1;
      continue;
    }
    const nameEnd = attribute.start + attribute.name.length;
    if (source.slice(attribute.start, nameEnd) !== attribute.name) {
      const at = positionOf(source, attribute.start);
      scan.warnings.push({
        file,
        line: at.line,
        column: at.column,
        message: `could not locate attribute name '${attribute.name}' on <${tagLabel}> in source text — not rewritten`
      });
      continue;
    }
    scan.edits.push({ start: attribute.start, end: nameEnd, text: target });
    scan.propsRenamed += 1;
  }
}

function warnUnresolvedElement(
  source: string,
  file: string,
  tagLabel: string,
  element: LibraryElement,
  renameableProps: ReadonlySet<string>,
  scan: Scan
): void {
  const suspicious = element.attributes
    .filter((attribute) => attribute.type === 'Attribute')
    .map((attribute) => attribute.name)
    .filter((name) => renameableProps.has(name));
  if (suspicious.length === 0) {
    return;
  }
  const at = positionOf(source, element.start);
  scan.warnings.push({
    file,
    line: at.line,
    column: at.column,
    message: `<${tagLabel}> is not resolvable to an import but has renameable prop(s) ${suspicious.join(', ')} — not rewritten, review manually`
  });
}

function walkFragment(fragment: AST.Fragment, visit: (element: LibraryElement) => void): void {
  for (const node of fragment.nodes) {
    if (node.type === 'Component' || node.type === 'SvelteComponent') {
      visit(node);
    }
    // Structural recursion over every fragment-bearing property covers all
    // element and block kinds (including future ones) without enumerating them.
    if ('fragment' in node && typeof node.fragment === 'object') {
      walkFragment(node.fragment, visit);
    }
    if ('body' in node && typeof node.body === 'object') {
      walkFragment(node.body, visit);
    }
    if ('consequent' in node) {
      walkFragment(node.consequent, visit);
    }
    if ('alternate' in node && node.alternate !== null) {
      walkFragment(node.alternate, visit);
    }
    if ('fallback' in node) {
      const fallback = node.fallback ?? null;
      if (fallback !== null) {
        walkFragment(fallback, visit);
      }
    }
    if ('pending' in node && node.pending !== null) {
      walkFragment(node.pending, visit);
    }
    if ('then' in node && node.then !== null) {
      walkFragment(node.then, visit);
    }
    if ('catch' in node && node.catch !== null) {
      walkFragment(node.catch, visit);
    }
  }
}

/**
 * Rewrites every deprecated event-prop spelling on a library component in a
 * consumer's `.svelte` file to the corrected one (`legacy-pairs.ts`). Only
 * components resolvable to an import from this package are touched; a tag
 * that cannot be resolved but carries a renameable prop is reported instead.
 */
export function transformSvelte(
  source: string,
  file: string,
  options: TransformOptions = {}
): TransformResult {
  const resolver = resolverFor(options);
  let root: AST.Root;
  try {
    root = parse(source, { modern: true, filename: file });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      code: source,
      changed: false,
      propsRenamed: 0,
      warnings: [{ file, line: 1, column: 1, message: `could not parse file: ${message}` }]
    };
  }
  const scan: Scan = {
    edits: [],
    warnings: [],
    bindings: new Map(),
    importsLibrary: false,
    propsRenamed: 0
  };
  const instance = root.instance ?? null;
  if (instance !== null) {
    scanScript(source, file, instance.content, resolver, scan);
  }
  const moduleScript = root.module ?? null;
  if (moduleScript !== null) {
    scanScript(source, file, moduleScript.content, resolver, scan);
  }
  const renames = legacyRenameTable();
  walkFragment(root.fragment, (element) => {
    const resolution =
      element.type === 'Component'
        ? resolveTag(element.name, scan.bindings)
        : resolveThisExpression(element.expression, scan.bindings);
    const tagLabel = element.type === 'Component' ? element.name : 'svelte:component';
    if (resolution.kind === 'library') {
      renameAttributes(
        source,
        file,
        tagLabel,
        resolution.component,
        element,
        renames.get(resolution.component) ?? null,
        scan
      );
    } else if (resolution.kind === 'unresolved' && scan.importsLibrary) {
      warnUnresolvedElement(source, file, tagLabel, element, legacyProps(), scan);
    }
  });
  const code = applyEdits(source, scan.edits);
  return {
    code,
    changed: code !== source,
    propsRenamed: scan.propsRenamed,
    warnings: scan.warnings
  };
}
