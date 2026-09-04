/**
 * Derives the correct spelling for an event prop that breaks the casing rule.
 *
 * `DESIGN_PRINCIPLES.md`: a native DOM event forwarded as-is keeps Svelte's own
 * lowercase spelling (`onclick`); every synthesized event is camelCase from the
 * character after `on` (`onRowClick`). The 100 props in
 * `scripts/event-casing-baseline.json` predate that rule.
 *
 * The awkward case is a synthetic event written entirely in lowercase, where
 * the word boundaries are no longer in the name: `onbarclick` has to become
 * `onBarClick`, but nothing in the string says where `bar` ends. That is
 * recovered by segmenting against the domain vocabulary below rather than by
 * asking a person, and every candidate segmentation is reported when more than
 * one exists — a silently-picked split would put a wrong prop name into the
 * public API.
 */

export const NATIVE_EVENTS: ReadonlySet<string> = new Set([
  'click',
  'dblclick',
  'auxclick',
  'contextmenu',
  'mousedown',
  'mouseup',
  'mousemove',
  'mouseenter',
  'mouseleave',
  'mouseover',
  'mouseout',
  'keydown',
  'keyup',
  'keypress',
  'focus',
  'blur',
  'focusin',
  'focusout',
  'input',
  'change',
  'submit',
  'reset',
  'select',
  'invalid',
  'scroll',
  'wheel',
  'resize',
  'drag',
  'dragstart',
  'dragend',
  'dragenter',
  'dragleave',
  'dragover',
  'drop',
  'touchstart',
  'touchend',
  'touchmove',
  'touchcancel',
  'pointerdown',
  'pointerup',
  'pointermove',
  'pointerenter',
  'pointerleave',
  'pointerover',
  'pointerout',
  'pointercancel',
  'copy',
  'cut',
  'paste',
  'load',
  'error',
  'abort',
  'animationstart',
  'animationend',
  'animationiteration',
  'transitionend',
  'transitionstart',
  'toggle',
  'close',
  'cancel',
  'play',
  'pause',
  'ended',
  'volumechange',
  'timeupdate',
  'loadstart',
  'loadeddata',
  'loadedmetadata',
  'canplay',
  'canplaythrough',
  'seeking',
  'seeked',
  'waiting',
  'stalled',
  'suspend',
  'progress',
  'ratechange',
  'durationchange',
  'emptied'
]);

/**
 * The words these event names are built from. Deliberately a closed domain
 * list, not a general dictionary: an English dictionary happily segments
 * `barclick` as `bar`+`click` but also finds spurious splits in other names,
 * and the extra recall buys nothing when the corpus is this small.
 */
const VOCABULARY: ReadonlySet<string> = new Set([
  // subjects
  'point',
  'bar',
  'page',
  'month',
  'range',
  'scroll',
  'slice',
  'resize',
  'link',
  'node',
  'step',
  'key',
  'row',
  'chip',
  'stage',
  'rich',
  'file',
  'image',
  'video',
  'files',
  'suggestion',
  'voice',
  'action',
  'feedback',
  'state',
  'position',
  // verbs
  'open',
  'close',
  'remove',
  'add',
  'edit',
  'create',
  'clear',
  'apply',
  'attach',
  'dismiss',
  'retry',
  'send',
  'stop',
  'complete',
  'settled',
  'toggle',
  'click',
  'hover',
  'change',
  'select',
  'end',
  'start',
  'after',
  'compare',
  'single',
  // Words that are also DOM event names. They appear here because a component
  // may raise its own event of the same name -- Img's onerror reports a failed
  // inline fetch, Slider's oninput reports a dragged value -- and those are
  // synthetic, so they still need a camelCase target.
  'submit',
  'copy',
  'input',
  'cancel',
  'error',
  'volume',
  'resize',
  'progress'
]);

export type DerivedName =
  /** Already correct; nothing to rename. */
  | { readonly kind: 'ok'; readonly target: string }
  /** A native event that was camelCased; the fix is to lowercase it. */
  | { readonly kind: 'native'; readonly target: string }
  /** Synthetic, word boundaries already visible; raise the first letter. */
  | { readonly kind: 'partial'; readonly target: string }
  /** Synthetic and all lowercase; recovered from the vocabulary. */
  | { readonly kind: 'segmented'; readonly target: string }
  /** Could not be derived, or derived more than one way. Needs a decision. */
  | { readonly kind: 'unresolved'; readonly candidates: readonly string[] };

function segmentations(body: string): readonly (readonly string[])[] {
  if (body.length === 0) {
    return [[]];
  }
  const found: string[][] = [];
  for (let i = 1; i <= body.length; i++) {
    const head = body.slice(0, i);
    if (!VOCABULARY.has(head)) {
      continue;
    }
    for (const tail of segmentations(body.slice(i))) {
      found.push([head, ...tail]);
    }
  }
  return found;
}

const capitalize = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1);

/** DOM event types a genuine forward would hand straight to the caller. */
const DOM_EVENT_TYPE =
  /\b(?:Event|UIEvent|MouseEvent|KeyboardEvent|FocusEvent|InputEvent|ClipboardEvent|PointerEvent|TouchEvent|DragEvent|WheelEvent|SubmitEvent|AnimationEvent|TransitionEvent|ProgressEvent)\b/;

/**
 * Whether a prop forwards a DOM event, judged by what it hands the caller.
 *
 * Sharing a name with a DOM event is not enough, and assuming it was would
 * corrupt correct props: `TypewriterText.onProgress` takes a
 * `TypewriterProgress` and `Table.onToggle` takes `(rowIndex, checked,
 * originalIndex)`. Neither is the DOM's `progress` or `toggle` event, so
 * lowercasing them on a name match alone would rename four already-correct
 * props into wrong ones. `Input.onBlur?: (event: FocusEvent) => void` is the
 * real thing, and the signature is what says so.
 */
export function forwardsDomEvent(signature: unknown): boolean {
  return typeof signature === 'string' && DOM_EVENT_TYPE.test(signature);
}

export function deriveEventName(prop: string, signature?: unknown): DerivedName {
  if (!prop.startsWith('on') || prop.length <= 2) {
    return { kind: 'unresolved', candidates: [] };
  }
  const body = prop.slice(2);
  const lower = body.toLowerCase();

  if (NATIVE_EVENTS.has(lower) && forwardsDomEvent(signature)) {
    // Native events are correct only in Svelte's lowercase spelling.
    return body === lower ? { kind: 'ok', target: prop } : { kind: 'native', target: `on${lower}` };
  }

  const firstIsUpper = body.charAt(0) === body.charAt(0).toUpperCase();
  if (firstIsUpper) {
    return { kind: 'ok', target: prop };
  }

  if (/[A-Z]/.test(body)) {
    // Starts lowercase then switches partway through -- the boundaries survive,
    // so only the first letter is wrong.
    return { kind: 'partial', target: `on${capitalize(body)}` };
  }

  const names = new Set(segmentations(body).map((words) => `on${words.map(capitalize).join('')}`));
  if (names.size === 1) {
    return { kind: 'segmented', target: [...names][0] };
  }
  return { kind: 'unresolved', candidates: [...names].sort() };
}
