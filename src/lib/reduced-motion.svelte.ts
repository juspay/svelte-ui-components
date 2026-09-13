/**
 * A live, reactive mirror of the OS `prefers-reduced-motion` preference.
 *
 * `prefersReducedMotion()` in `utils.ts` is a plain, un-reactive read -- exactly
 * right for the call sites that invoke it fresh on every interaction (Tabs,
 * Input, Scroller, ChatController, TypewriterText), but useless inside a
 * `$derived`/`$derived.by` that only recomputes when a *tracked* dependency
 * changes. A derived that calls it and returns early on the reduced-motion
 * branch -- Sheet's `flyParams` is the case that surfaced this -- reads no
 * Svelte state at all along that path, so it latches whatever the preference
 * happened to be on its first evaluation and never revisits it, in either
 * direction, for the life of the component instance.
 *
 * `current` below is real `$state`, so reading `reducedMotion.current` inside
 * a derived registers a tracked dependency wherever in the function body the
 * read happens -- an early `return` right after it still leaves the derived
 * subscribed, which is exactly the property a plain boolean lacks.
 *
 * One module-level `MediaQueryList` subscription for the whole page, rather
 * than one per consumer: the preference is a single global fact about the
 * browser tab, not something scoped to any particular mounted component, so
 * every reader shares this one listener instead of each taking out (and
 * needing to release) its own. It is intentionally never removed -- there is
 * no "stop caring about the OS setting" moment short of the page unloading,
 * at which point the browser reclaims it along with everything else. This
 * differs from VoiceOrb.svelte's own subscription, which is taken out and torn
 * down inside its `onMount`: that one has to seed a field before the first
 * animation frame and already owns an `onMount`/`onDestroy` pair for its
 * `ResizeObserver`, so pairing the listener with the same lifecycle costs it
 * nothing extra. A shared source has neither constraint, and no owning
 * component to pair teardown with in the first place.
 */

const query =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

let current = $state(query?.matches ?? false);

query?.addEventListener('change', (event: MediaQueryListEvent) => {
  current = event.matches;
});

export type ReducedMotionPreference = {
  /** The live OS preference. Read it inside a `$derived` to stay subscribed. */
  readonly current: boolean;
};

export const reducedMotion: ReducedMotionPreference = {
  get current(): boolean {
    return current;
  }
};
