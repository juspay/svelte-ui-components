import ts from 'typescript';
import { parse } from 'svelte/compiler';
import type { AST } from 'svelte/compiler';
import { directionConfig } from './map.ts';
import type { Direction, DirectionConfig } from './map.ts';

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
  readonly importsRewritten: number;
  readonly warnings: ReadonlyArray<TransformWarning>;
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
  importsRewritten: number;
  importsFromPackage: boolean;
  propsRenamed: number;
};

function packageSubpath(specifier: string, fromPackage: string): string | null {
  if (specifier === fromPackage) {
    return '';
  }
  if (specifier.startsWith(`${fromPackage}/`)) {
    return specifier.slice(fromPackage.length);
  }
  return null;
}

function rewriteSpecifierEdit(
  source: string,
  literal: object,
  value: string,
  config: DirectionConfig
): Edit | null {
  const subpath = packageSubpath(value, config.fromPackage);
  if (subpath === null) {
    return null;
  }
  const range = rangeOf(literal);
  if (range === null) {
    return null;
  }
  const quote = source.charAt(range.start);
  return {
    start: range.start,
    end: range.end,
    text: `${quote}${config.toPackage}${subpath}${quote}`
  };
}

/** Deep-walk an estree subtree for dynamic `import('...')` of the source package. */
function collectDynamicImportEdits(
  source: string,
  node: unknown,
  config: DirectionConfig,
  scan: Scan
): void {
  if (Array.isArray(node)) {
    for (const item of node) {
      collectDynamicImportEdits(source, item, config, scan);
    }
    return;
  }
  if (typeof node !== 'object' || node === null) {
    return;
  }
  if ('type' in node && node.type === 'ImportExpression' && 'source' in node) {
    const literal = node.source;
    if (
      typeof literal === 'object' &&
      literal !== null &&
      'type' in literal &&
      literal.type === 'Literal' &&
      'value' in literal &&
      typeof literal.value === 'string'
    ) {
      const edit = rewriteSpecifierEdit(source, literal, literal.value, config);
      if (edit !== null) {
        scan.edits.push(edit);
        scan.importsRewritten += 1;
        scan.importsFromPackage = true;
      }
    }
  }
  for (const value of Object.values(node)) {
    collectDynamicImportEdits(source, value, config, scan);
  }
}

function scanScript(
  source: string,
  file: string,
  program: Program,
  config: DirectionConfig,
  scan: Scan
): void {
  for (const statement of program.body) {
    if (
      (statement.type === 'ImportDeclaration' ||
        statement.type === 'ExportNamedDeclaration' ||
        statement.type === 'ExportAllDeclaration') &&
      statement.source != null &&
      typeof statement.source.value === 'string'
    ) {
      const edit = rewriteSpecifierEdit(source, statement.source, statement.source.value, config);
      if (edit !== null) {
        scan.edits.push(edit);
        scan.importsRewritten += 1;
      }
    }
    if (statement.type !== 'ImportDeclaration') {
      collectDynamicImportEdits(source, statement, config, scan);
      continue;
    }
    const specifier = typeof statement.source.value === 'string' ? statement.source.value : '';
    const fromPackage = packageSubpath(specifier, config.fromPackage) !== null;
    if (fromPackage) {
      scan.importsFromPackage = true;
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
          fromPackage && exported !== null ? { kind: 'component', exported } : { kind: 'other' }
        );
      } else if (spec.type === 'ImportNamespaceSpecifier') {
        scan.bindings.set(spec.local.name, fromPackage ? { kind: 'namespace' } : { kind: 'other' });
      } else {
        scan.bindings.set(spec.local.name, { kind: 'other' });
        if (fromPackage) {
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
  config: DirectionConfig,
  scan: Scan
): void {
  const table = config.renames.get(component) ?? null;
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
  config: DirectionConfig,
  scan: Scan
): void {
  const suspicious = element.attributes
    .filter((attribute) => attribute.type === 'Attribute')
    .map((attribute) => attribute.name)
    .filter((name) => config.allFromProps.has(name));
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

export function transformSvelte(
  source: string,
  file: string,
  direction: Direction
): TransformResult {
  const config = directionConfig(direction);
  let root: AST.Root;
  try {
    root = parse(source, { modern: true, filename: file });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      code: source,
      changed: false,
      propsRenamed: 0,
      importsRewritten: 0,
      warnings: [{ file, line: 1, column: 1, message: `could not parse file: ${message}` }]
    };
  }
  const scan: Scan = {
    edits: [],
    warnings: [],
    bindings: new Map(),
    importsRewritten: 0,
    importsFromPackage: false,
    propsRenamed: 0
  };
  const instance = root.instance ?? null;
  if (instance !== null) {
    scanScript(source, file, instance.content, config, scan);
  }
  const moduleScript = root.module ?? null;
  if (moduleScript !== null) {
    scanScript(source, file, moduleScript.content, config, scan);
  }
  walkFragment(root.fragment, (element) => {
    const resolution =
      element.type === 'Component'
        ? resolveTag(element.name, scan.bindings)
        : resolveThisExpression(element.expression, scan.bindings);
    const tagLabel = element.type === 'Component' ? element.name : 'svelte:component';
    if (resolution.kind === 'library') {
      renameAttributes(source, file, tagLabel, resolution.component, element, config, scan);
    } else if (resolution.kind === 'unresolved' && scan.importsFromPackage) {
      warnUnresolvedElement(source, file, tagLabel, element, config, scan);
    }
  });
  const code = applyEdits(source, scan.edits);
  return {
    code,
    changed: code !== source,
    propsRenamed: scan.propsRenamed,
    importsRewritten: scan.importsRewritten,
    warnings: scan.warnings
  };
}

function scriptKindFor(file: string): ts.ScriptKind {
  if (file.endsWith('.tsx')) {
    return ts.ScriptKind.TSX;
  }
  if (file.endsWith('.jsx')) {
    return ts.ScriptKind.JSX;
  }
  if (file.endsWith('.js') || file.endsWith('.mjs') || file.endsWith('.cjs')) {
    return ts.ScriptKind.JS;
  }
  return ts.ScriptKind.TS;
}

/** The module specifier a node carries, or null if it is not an import site. */
function specifierOf(node: ts.Node): ts.StringLiteralLike | null {
  if (ts.isImportDeclaration(node) && ts.isStringLiteralLike(node.moduleSpecifier)) {
    return node.moduleSpecifier;
  }
  if (ts.isExportDeclaration(node)) {
    const specifier = node.moduleSpecifier;
    if (typeof specifier !== 'undefined' && ts.isStringLiteralLike(specifier)) {
      return specifier;
    }
    return null;
  }
  // `import('x')` and `require('x')`.
  if (ts.isCallExpression(node) && node.arguments.length > 0) {
    const callee = node.expression;
    const isImport = callee.kind === ts.SyntaxKind.ImportKeyword;
    const isRequire = ts.isIdentifier(callee) && callee.text === 'require';
    const first = node.arguments[0];
    if ((isImport || isRequire) && ts.isStringLiteralLike(first)) {
      return first;
    }
    return null;
  }
  // `import X = require('x')`. TS-only syntax whose specifier hangs off an
  // ExternalModuleReference rather than a call expression.
  if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
    const expression = node.moduleReference.expression;
    if (ts.isStringLiteralLike(expression)) {
      return expression;
    }
    return null;
  }
  // `import('x').Foo` in type position.
  if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
    const literal = node.argument.literal;
    if (ts.isStringLiteralLike(literal)) {
      return literal;
    }
  }
  return null;
}

/**
 * Import-specifier rewrite for plain .ts/.js files (barrels, utilities).
 *
 * Parsed rather than matched. This was a context-anchored regex on the
 * reasoning that a specifier only appears after `from`, `import`, `import(` or
 * `require(` -- true, but those words appear just as readily in a comment or
 * inside a quoted string, and the regex rewrote all of them. TypeScript is
 * already a devDependency and already type-checks this directory, so the exact
 * answer costs nothing here. Only the literal's interior is replaced, so the
 * original quote style survives.
 */
export function transformModuleSpecifiers(
  source: string,
  file: string,
  direction: Direction
): TransformResult {
  const config = directionConfig(direction);
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.ESNext,
    true,
    scriptKindFor(file)
  );

  const edits: { readonly start: number; readonly end: number; readonly text: string }[] = [];
  const visit = (node: ts.Node): void => {
    const specifier = specifierOf(node);
    if (specifier !== null) {
      const subpath = packageSubpath(specifier.text, config.fromPackage);
      if (subpath !== null) {
        edits.push({
          start: specifier.getStart(sourceFile) + 1,
          end: specifier.getEnd() - 1,
          text: `${config.toPackage}${subpath}`
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  // Applied back to front so earlier offsets stay valid.
  let code = source;
  for (const edit of [...edits].reverse()) {
    code = code.slice(0, edit.start) + edit.text + code.slice(edit.end);
  }

  return {
    code,
    changed: code !== source,
    propsRenamed: 0,
    importsRewritten: edits.length,
    warnings: []
  };
}
