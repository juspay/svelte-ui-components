/**
 * Turns an `aria-labelledby` id list into text, from the element that owns the
 * reference rather than from the control the text is meant for.
 *
 * ARIA id references do not cross a shadow boundary: an `aria-labelledby` on a
 * control inside `<sui-*>`'s shadow root can only name an element in that same
 * root, so an id that points at a label in the consumer's page resolves to
 * nothing and the control ends up with no name at all. A string crosses the
 * boundary fine, so a wrapper resolves the ids on the HOST's root -- the page,
 * or the enclosing shadow root when the element is itself nested in one -- and
 * forwards the text as `aria-label`.
 */

/** The two roots that can hold an element by id. */
export type LabelRoot = Document | ShadowRoot;

const SEPARATOR = /\s+/;

const idsOf = (ids: string | undefined): string[] =>
  typeof ids === 'string' ? ids.trim().split(SEPARATOR).filter(Boolean) : [];

/** A root the host sits in, or null while it is detached or has no id lookup. */
export function labelRootOf(host: Node): LabelRoot | null {
  const root = host.getRootNode();
  return isLabelRoot(root) ? root : null;
}

// A host adopted into another document uses that realm's constructors.
// Node kinds and the native shadow-host relation survive that adoption.
function isLabelRoot(root: Node): root is LabelRoot {
  return (
    root.nodeType === Node.DOCUMENT_NODE ||
    (root.nodeType === Node.DOCUMENT_FRAGMENT_NODE && 'host' in root && 'getElementById' in root)
  );
}

/**
 * The text of every referenced element that exists, in id order, joined by a
 * space; undefined when none resolve or none has text. An id that is missing is
 * skipped rather than failing the rest, as the platform's own name computation
 * does.
 */
export function readReferencedText(root: LabelRoot, ids: string | undefined): string | undefined {
  const text = idsOf(ids)
    .map((id) => root.getElementById(id)?.textContent?.replace(/\s+/g, ' ').trim() ?? '')
    .filter((part) => part !== '')
    .join(' ');
  return text === '' ? undefined : text;
}

/**
 * Calls `onChange` with the current text now and again whenever it may have
 * changed, and returns the function that stops watching.
 *
 * Without this the name is a copy taken once, so a label that is rendered after
 * the element, translated, edited, or replaced by a re-render leaves the control
 * with a stale or missing name. The root is watched rather than each referenced
 * element because a replaced element is detached and would never report again;
 * the callback is a few `getElementById` lookups, and it is batched per task by
 * the platform, so watching a busy page stays cheap. Nothing is watched while
 * the element has no ids to resolve.
 */
export function watchReferencedText(
  root: LabelRoot,
  ids: string | undefined,
  onChange: (text: string | undefined) => void,
  resolveRoot: () => LabelRoot | null = () => root
): () => void {
  const referencedIds = new Set(idsOf(ids));
  if (referencedIds.size === 0) {
    onChange(undefined);
    return () => {};
  }
  let watchedRoot: LabelRoot | null = null;
  let stopped = false;
  let reconnectQueued = false;
  const refresh = (): void => {
    if (stopped) {
      return;
    }
    const current = resolveRoot();
    if (current === null) {
      // A native observer may reconnect a WC later in the same delivery, before
      // Svelte destroys its component. Retain the last root subscription and
      // recheck once after that delivery, including moves into another root.
      if (!reconnectQueued) {
        reconnectQueued = true;
        queueMicrotask(() => {
          reconnectQueued = false;
          if (!stopped && resolveRoot() !== null) {
            refresh();
          }
        });
      }
      onChange(undefined);
      return;
    }
    if (current !== watchedRoot) {
      observer.disconnect();
      watchedRoot = current;
      if (current !== null) {
        observer.observe(current, {
          subtree: true,
          childList: true,
          characterData: true,
          attributes: true,
          attributeFilter: ['id'],
          attributeOldValue: true
        });
      }
    }
    onChange(readReferencedText(current, ids));
  };
  const observer = new MutationObserver((records) => {
    // An ID rename can remove or replace a reference without changing any text.
    // Watch only IDs, not the mirrored aria-label, and coalesce a swap into one
    // lookup of the final tree. Unrelated ID edits need no name recomputation.
    if (
      records.some(
        (record) =>
          record.type !== 'attributes' ||
          referencedIds.has(record.oldValue ?? '') ||
          (record.target.nodeType === Node.ELEMENT_NODE &&
            referencedIds.has((record.target as Element).id))
      )
    ) {
      refresh();
    }
  });
  refresh();
  return () => {
    stopped = true;
    observer.disconnect();
  };
}
