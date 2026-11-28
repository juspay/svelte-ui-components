import { beforeUpdate, createEventDispatcher, onMount } from 'svelte';

type Dispatch = (type: string, detail?: unknown) => boolean;

/**
 * `createEventDispatcher` with Svelte 4's delivery rule.
 *
 * Svelte 4 attached a component's `on:` listeners only after the component had initialised, so an
 * event dispatched from the script body, or from the first run of a `$:` block, reached nobody.
 * Svelte 5 hands the listeners in with the props, so the same dispatch is delivered. Input's
 * `$: dispatch('stateChange', ...)` is the case that matters: under Svelte 5 every consumer would
 * receive one extra `stateChange` before mount, ahead of the `focus` it used to follow.
 *
 * The first `beforeUpdate` runs synchronously at the end of initialisation, before any child
 * mounts, which is the moment Svelte 4 attached the listeners. Events from `onMount`, from a
 * child's `onMount`, and from every later update are delivered as before.
 */
export function createLegacyEventDispatcher(): Dispatch {
  const dispatch = createEventDispatcher();
  let listening = false;
  beforeUpdate(() => {
    listening = true;
  });
  return (type, detail) => {
    if (!listening) {
      return true;
    }
    return dispatch(type, detail);
  };
}

/**
 * Returns a function that is false while the component is still initialising and true afterwards.
 *
 * It marks the same moment as `createLegacyEventDispatcher`: before it, Svelte 4 had registered
 * neither the component's listeners nor its `bind:` callbacks, so nothing the component did could
 * reach its parent yet.
 */
export function createInitialisedCheck(): () => boolean {
  let initialised = false;
  beforeUpdate(() => {
    initialised = true;
  });
  return () => initialised;
}

/** The raw props of the v1 component that is being created right now, until it claims them. */
let pendingProps: unknown = null;

/**
 * Wraps an exported v1 component so `replayBoundProps` can see the props object it was called with.
 *
 * A legacy-mode component cannot inspect its own props for a setter: `$$props` hides them and the
 * compiler rejects `arguments`. A Svelte 5 component is a function of `(internals, props)`, so the
 * wrapper notes `props` for the duration of that call and passes both through untouched. The
 * component claims the note on its first line, so a component nested inside it never sees it.
 */
export function withRawProps<C extends (internals: never, props: never) => unknown>(
  component: C
): C {
  function wrapped(internals: unknown, props: unknown): unknown {
    const previous = pendingProps;
    pendingProps = props;
    try {
      return Reflect.apply(component, null, [internals, props]);
    } finally {
      pendingProps = previous;
    }
  }
  return Object.assign(wrapped, component);
}

/**
 * Replays what Svelte 4 did for every `bind:` on a component: call the binding once after the
 * component was created.
 *
 * For a bound object the parent treated that call as a change, because Svelte 4 never considered
 * two objects equal. Its `$:` blocks ran again and it handed the same object back down, so the
 * component's own `$:` blocks ran again too, now with the DOM in place. That second pass is
 * visible: an `<Input bind:properties>` holding a partial value turns `Invalid` and shows its
 * error as soon as it mounts, where an unbound Input stays `InProgress` until it is blurred.
 * Svelte 5 makes no such call, so without this the bound and unbound cases would look the same.
 *
 * A bound prop arrives with a setter and an unbound one without, which is the only way to tell
 * the two apart; the replay must not happen for an unbound prop, because Svelte 4 did nothing
 * there. A component created without the `withRawProps` wrapper (one v1 component rendering
 * another) has nothing to inspect and replays nothing, which is right: none of them binds an
 * object to an inner component.
 */
export function replayBoundProps(assign: Record<string, () => void>): ReadonlySet<string> {
  const props = pendingProps;
  pendingProps = null;
  const bound = new Set<string>();
  if (props === null || typeof props !== 'object') {
    return bound;
  }
  for (const key of Object.keys(assign)) {
    try {
      if (typeof Object.getOwnPropertyDescriptor(props, key)?.set === 'function') {
        bound.add(key);
      }
    } catch {
      // Not inspectable: leave this prop alone.
    }
  }
  if (bound.size > 0) {
    onMount(() => {
      for (const key of bound) {
        assign[key]();
      }
    });
  }
  return bound;
}

type RoundTripStep = 'skip' | 'notify' | 'round-trip';

/**
 * Decides what a `$:` block that reassigns a bound prop has to do to notify the parent as often
 * as Svelte 4 did. Used by InputButton, whose block reassigns `properties` whenever the field's
 * validation state changes.
 *
 * In Svelte 4 such a reassignment went up to the parent, came back down as a prop update, re-ran
 * the block, and went up once more before the binding's guard stopped it: two parent updates for
 * one change. When the parent had handed the prop down first (the bind-on-create call), the same
 * guard stopped it after one. Svelte 5 never comes back down, so the second update is replayed.
 * The bookkeeping lives here, outside the component, so it is not reactive state itself.
 */
export function createRoundTripGate() {
  let echoing = false;
  let handedDown = false;
  let last: unknown;
  return {
    /** The parent has just handed the prop down (the bind-on-create replay). */
    handDown(): void {
      handedDown = true;
    },
    /** The next block run is the replayed second update and must not notify again. */
    echo(): void {
      echoing = true;
    },
    next(state: unknown, initialised: boolean): RoundTripStep {
      if (!initialised) {
        last = state;
        return 'skip';
      }
      if (echoing) {
        echoing = false;
        return 'skip';
      }
      const selfInitiated = state !== last && !handedDown;
      last = state;
      handedDown = false;
      return selfInitiated ? 'round-trip' : 'notify';
    }
  };
}

/**
 * Text as Svelte 4 printed it. `{value}` showed `null` and `undefined` as those words; Svelte 5
 * prints nothing for either. A Table cell holding `null` is the visible case.
 */
export function legacyText(value: unknown): unknown {
  return value === null || typeof value === 'undefined' ? String(value) : value;
}

/** `{@html value}` as Svelte 4 inserted it: `undefined` became the word, `null` became nothing. */
export function legacyHtml(value: unknown): unknown {
  return typeof value === 'undefined' ? 'undefined' : value;
}

let urlResolver: HTMLAnchorElement | null = null;

function sameUrl(current: string, next: string): boolean {
  if (current === next) {
    return true;
  }
  if (urlResolver === null) {
    urlResolver = document.createElement('a');
  }
  urlResolver.href = next;
  return current === urlResolver.href;
}

function writeSrc(node: HTMLImageElement, value: unknown): void {
  if (value === '' || value === null || typeof value === 'undefined') {
    if (node.hasAttribute('src')) {
      node.removeAttribute('src');
    }
    return;
  }
  if (!sameUrl(node.src, String(value))) {
    node.setAttribute('src', String(value));
  }
}

/**
 * `<img src>` as Svelte 4 rendered it. The action is the only writer of `src`: it never writes an
 * empty value (Svelte 4 left the attribute off), and it rewrites only when the URL really changes
 * (Svelte 4's `src_url_equal`), so an image is not reloaded on every update.
 *
 * One difference remains and is not fixable here. Svelte 5 builds markup in a template fragment
 * owned by an inert document and moves it into the page on mount. Chrome can mark an `<img>` with
 * no `src` as broken during that move and then draws its broken-image icon, where Svelte 4's
 * image, built in the page's own document, showed an empty frame. Images with a source are not
 * affected. See docs/V1_COMPAT.md.
 */
export function legacySrc(node: HTMLImageElement, value: unknown) {
  writeSrc(node, value);
  return {
    update(next: unknown) {
      writeSrc(node, next);
    }
  };
}
