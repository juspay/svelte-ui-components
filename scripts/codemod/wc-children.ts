import type { TransformWarning } from './transform.ts';

/**
 * Detects the one breaking change in the 4.0.0 custom-element surface:
 * `children` is no longer a declared prop on any `sui-*` element.
 *
 * Three elements shipped it in 3.1.4 — `sui-chat-bubble`, `sui-draggable` and
 * `sui-resizable` — and none of them had a `<slot>`, so assigning the property
 * was the only way to give them content. Declaring it was also what left
 * `element.children` returning undefined instead of the native HTMLCollection,
 * so `el.children.length` threw. Both are fixed together: the declaration is
 * gone and those wrappers forward the default slot instead.
 *
 * This reports rather than rewrites. The fix moves content from a JavaScript
 * assignment into markup, which changes where the content is authored, not just
 * how it is spelled — a person has to decide what the light-DOM children are.
 * Auto-editing that would be guesswork dressed as a codemod.
 */
export const CHILDREN_BREAKING_TAGS: ReadonlyArray<string> = [
  'sui-chat-bubble',
  'sui-draggable',
  'sui-resizable'
];

/**
 * Matches `<expr>.children =` but not `==`/`===`, and not `.childNodes`.
 * Deliberately loose on the left-hand side: a consumer reaches these elements
 * through any expression at all (`ref.current`, `this.$refs.panel`, a query
 * result), so anchoring on the property and confirming the tag appears in the
 * same file gives far better recall than trying to type the receiver.
 */
const CHILDREN_ASSIGNMENT = /(^|[^.\w])([\w$\][().]*?)\.children\s*=(?!=)/gm;

const lineAndColumn = (source: string, index: number): { line: number; column: number } => {
  const upTo = source.slice(0, index);
  const lines = upTo.split('\n');
  return { line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 };
};

/**
 * Returns one warning per `.children =` assignment in a file that also mentions
 * an affected tag. Requiring the tag in the same file is what keeps this from
 * flagging every DOM manipulation in a codebase: `element.children` is a common
 * expression, and only these three elements changed.
 */
export const findChildrenAssignments = (
  source: string,
  file: string
): ReadonlyArray<TransformWarning> => {
  const mentioned = CHILDREN_BREAKING_TAGS.filter((tag) => source.includes(tag));
  if (mentioned.length === 0) {
    return [];
  }

  const warnings: TransformWarning[] = [];
  for (const match of source.matchAll(CHILDREN_ASSIGNMENT)) {
    if (typeof match.index !== 'number') {
      continue;
    }
    const { line, column } = lineAndColumn(source, match.index + match[1].length);
    warnings.push({
      file,
      line,
      column,
      message:
        `assignment to \`.children\` in a file using ${mentioned.join(', ')}. ` +
        'That property is no longer declared on those elements in 4.0.0; assigning it ' +
        'now sets an inert expando and the content silently disappears. Pass the ' +
        'content as light-DOM children instead — `<sui-draggable><div>…</div></sui-draggable>` ' +
        '— which the wrappers now forward through their default slot. Reading ' +
        '`element.children` is unaffected, and in fact returns a real HTMLCollection again.'
    });
  }
  return warnings;
};
