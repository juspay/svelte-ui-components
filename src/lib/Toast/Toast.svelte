<script lang="ts">
  import { untrack } from 'svelte';
  import type { ToastDirection, ToastProperties } from './properties';
  import Img from '../Img/Img.svelte';

  let {
    duration = 2000,
    leftIcon,
    message = '',
    subtext,
    rightIcon,
    type,
    direction,
    overlapPage = true,
    inAnimationOffset,
    inAnimationDuration,
    outAnimationOffset,
    outAnimationDuration,
    testId,
    messageTestId,
    subTextTestId,
    closeIconTestId,
    ontoasthide,
    bottomContent,
    classes
  }: ToastProperties = $props();

  let showToast = $state(true);

  const rootClass = $derived(
    ['toast', type ?? '', classes ?? ''].filter((cls) => cls.length > 0).join(' ')
  );

  // Unset `direction` behaves like 'top-to-bottom' -- the same fallthrough the
  // old `getAnimationConfig` switch used (`case 'top-to-bottom': default:`).
  const resolvedDirection: ToastDirection = $derived(direction ?? 'top-to-bottom');

  function directionalOffset(dir: ToastDirection, distance: number): { x?: number; y?: number } {
    switch (dir) {
      case 'left-to-right':
        return { x: -distance };
      case 'right-to-left':
        return { x: distance };
      case 'bottom-to-top':
        return { y: distance };
      case 'top-to-bottom':
      default:
        return { y: -distance };
    }
  }

  // `@starting-style` (in the stylesheet below) supplies one shared "hidden"
  // frame that the entrance reads from *and* the exit animates back to --
  // unlike the old `in:fly`/`out:fly`, CSS has no way to give entry and exit
  // independent offsets, since both converge on the same non-`.is-visible`
  // rule. `inAnimationOffset` wins when both are set. When neither is set,
  // this resolves to `{}` and no inline style is emitted at all, so the
  // direction defaults in CSS (themeable via `--distance-overlay`) apply.
  const enterOffset: { x?: number; y?: number } = $derived.by(() => {
    const distance = inAnimationOffset ?? outAnimationOffset;
    return distance == null ? {} : directionalOffset(resolvedDirection, distance);
  });

  // A `0`/`0s` CSS transition-duration never starts a transition, so it never
  // fires `transitionend`, so `ontoasthide` (below) would never fire -- floor
  // at 50ms so the transition always runs. Same reasoning as the reduced-motion
  // guard in the stylesheet, which floors at 0.05s rather than 0s: under heavy
  // main-thread jank a 1ms transition can still get style-recalc-coalesced
  // across a single frame with no observable "before" frame, which drops
  // `transitionend` the same way a literal 0 does. 50ms clears a normal frame
  // budget with margin while staying well under perceptible motion.
  function toDurationStyle(ms?: number | null): string | null {
    return typeof ms === 'number' ? `${Math.max(ms, 50)}ms` : null;
  }

  const openDurationStyle = $derived(toDurationStyle(inAnimationDuration));
  const closeDurationStyle = $derived(toDurationStyle(outAnimationDuration));

  function hideToast() {
    showToast = false;
  }

  function handleTransitionEnd(event: TransitionEvent) {
    // `currentTarget` excludes `transitionend` bubbling up from inside
    // consumer-supplied `bottomContent`; `propertyName` narrows the transition
    // shorthand's three properties (opacity/transform/display) down to one
    // firing; `!showToast` excludes the entrance's own opacity transition.
    //
    // A rapid re-show while this is still closing interrupts the closing
    // transition -- per spec, an interrupted transition never fires its own
    // transitionend, only the one that actually runs to completion does. That
    // is correct here, not a gap: the interrupted instance's closing
    // transitionend was never going to reflect where the toast ends up
    // regardless, and !showToast is read fresh at whichever transition
    // actually completes, against whatever showToast holds at that moment --
    // correct under any reversal ordering, not just the common single-close
    // case this guard was originally written for.
    if (event.target === event.currentTarget && event.propertyName === 'opacity' && !showToast) {
      ontoasthide?.();
    }
  }

  // Track `message` and `duration` as reactive dependencies so the timer
  // restarts whenever either prop changes. Writing `showToast = true` via
  // `untrack` prevents the assignment from enrolling `showToast` as a
  // dependency of this effect, which would create an unwanted reactive cycle.
  // eslint-disable-next-line no-restricted-syntax
  $effect(() => {
    void message;
    void duration;

    untrack(() => {
      showToast = true;
    });

    const id = setTimeout(hideToast, duration);

    return () => {
      clearTimeout(id);
    };
  });
</script>

<!-- role="alert"/aria-live="assertive" re-announce reliably for the dominant
     usage (a consumer's own {#if} mounts a fresh Toast per notification, a
     fresh node every time, unambiguous to any AT). A single long-lived Toast
     instance reused across separate notifications purely via prop changes --
     relying on this same node's display:none -> flex toggle to register as a
     fresh insertion -- is the one shape this hasn't been verified against on
     real AT (no automated test exercises a screen reader here, before or
     after this file's CSS-native migration). Flagging rather than guessing:
     if that usage shape turns up a real gap, the established fix is toggling
     aria-live off and back on around the reshow to force a re-announce,
     not a change to the CSS transition mechanics above. -->
<div
  class={rootClass}
  class:is-visible={showToast}
  class:no-page-overlap={!overlapPage}
  data-direction={resolvedDirection}
  role="alert"
  aria-live="assertive"
  style:--toast-open-duration={openDurationStyle}
  style:--toast-close-duration={closeDurationStyle}
  style:--toast-enter-x={enterOffset.x}
  style:--toast-enter-y={enterOffset.y}
  ontransitionend={handleTransitionEnd}
  data-pw={testId}
  testID={testId}
>
  {#if typeof leftIcon === 'string' && leftIcon.length > 0}
    <div class="toast-icon-wrapper">
      <Img inlineSvg src={leftIcon} alt="" fallback="" />
    </div>
  {/if}

  <div class="toast-message" data-pw={messageTestId} testID={messageTestId}>
    {message}
    {#if typeof subtext === 'string' && subtext.length > 0}
      <div class="toast-subtext" data-pw={subTextTestId} testID={subTextTestId}>{subtext}</div>
    {/if}

    {#if typeof bottomContent === 'function'}
      {@render bottomContent()}
    {/if}
  </div>

  {#if typeof rightIcon === 'string' && rightIcon.length > 0}
    <div
      class="close-button"
      tabindex="0"
      role="button"
      onclick={hideToast}
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          hideToast();
        }
      }}
      data-pw={closeIconTestId}
      testID={closeIconTestId}
    >
      <Img inlineSvg src={rightIcon} alt="Close" fallback="" />
    </div>
  {/if}
</div>

<style>
  .toast {
    padding: var(--toast-padding, 10px);
    font-size: var(--toast-font-size, 14px);
    font-family: var(--toast-font-family, inherit);
    font-weight: var(--toast-font-weight, inherit);
    height: var(--toast-height, fit-content);
    border-radius: var(--toast-border-radius, var(--radius, 4px));
    border: var(--toast-border, none);
    border-style: var(--toast-border-style);
    width: var(--toast-width, fit-content);
    align-items: var(--toast-align-items, center);
    margin: var(--toast-margin, 0px 10px 10px 10px);
    justify-content: var(--toast-justify-content, space-between);
    z-index: var(--toast-z-index, 1000);
    position: var(--toast-position, absolute);
    top: var(--toast-top, 10px);
    left: var(--toast-left, 0);
    right: var(--toast-right, 0);
    bottom: var(--toast-bottom, auto);
    background-color: var(--toast-background-color, #87ceeb);
    box-sizing: var(--toast-box-sizing);

    /* A toast is a transient status overlay, not a click target: it floats
       above page content (often over drawer/footer CTAs) and used to swallow
       clicks meant for the controls beneath it for its whole duration.
       Click-through by default; the close button re-enables its own hit
       area below, and consumers with actionable bottomContent can opt the
       whole toast back in via --toast-pointer-events: auto. */
    pointer-events: var(--toast-pointer-events, none);

    /* Closed / pre-enter state. `@starting-style` below reuses these same
       values for the entrance's "before" frame, and removing `.is-visible`
       transitions back to these same values for the exit -- one shared
       "hidden" declaration, not independent in/out targets the way
       `in:fly`/`out:fly` configs could be. */
    display: none;
    opacity: 0;
    transform: translate(var(--toast-enter-x, 0px), var(--toast-enter-y, 0px));

    /* max(50ms, …) rather than trusting the JS-side floor alone (toDurationStyle,
       in the script block): that only clamps the inAnimationDuration/
       outAnimationDuration PROP path. A consumer overriding --toast-close-duration
       directly via CSS -- the whole point of exposing it as a token -- bypasses
       the prop entirely, and a 0s/1ms transition never starts, so it never fires
       transitionend, so ontoasthide never runs. The floor has to live wherever
       the duration is actually consumed, not just where the props feed it. */
    transition:
      opacity max(50ms, var(--toast-close-duration, var(--motion-duration, 0.8s)))
        var(--toast-close-easing, var(--motion-easing, ease-in)),
      transform max(50ms, var(--toast-close-duration, var(--motion-duration, 0.8s)))
        var(--toast-close-easing, var(--motion-easing, ease-in)),
      display max(50ms, var(--toast-close-duration, var(--motion-duration, 0.8s))) allow-discrete;
  }

  .toast.is-visible {
    display: var(--toast-display, flex);
    opacity: var(--toast-opacity, 1);
    transform: translate(0, 0);

    /* 400ms matches --duration-slow exactly (DESIGN_PRINCIPLES.md #1's scale),
       so it sits in this chain as the named tier; 800ms (the close side above)
       matches no named tier and skips straight to the root token. */
    /* Same max(50ms, …) floor as the closed-state block below, and for the same
       reason -- a consumer-set --toast-open-duration can bypass the JS-side
       floor on the inAnimationDuration prop just as easily as the close side. */
    transition:
      opacity
        max(50ms, var(--toast-open-duration, var(--duration-slow, var(--motion-duration, 0.4s))))
        var(--toast-open-easing, var(--ease-out, var(--motion-easing, ease-out))),
      transform
        max(50ms, var(--toast-open-duration, var(--duration-slow, var(--motion-duration, 0.4s))))
        var(--toast-open-easing, var(--ease-out, var(--motion-easing, ease-out))),
      display
        max(50ms, var(--toast-open-duration, var(--duration-slow, var(--motion-duration, 0.4s))))
        allow-discrete;

    @starting-style {
      opacity: 0;
      transform: translate(var(--toast-enter-x, 0px), var(--toast-enter-y, 0px));
    }
  }

  .no-page-overlap {
    position: var(--toast-position, relative);
  }

  .toast[data-direction='left-to-right'] {
    --toast-enter-x: calc(-1 * var(--distance-overlay, 60px));
  }
  .toast[data-direction='right-to-left'] {
    --toast-enter-x: var(--distance-overlay, 60px);
  }
  .toast[data-direction='bottom-to-top'] {
    --toast-enter-y: var(--distance-overlay, 60px);
  }
  .toast[data-direction='top-to-bottom'] {
    --toast-enter-y: calc(-1 * var(--distance-overlay, 60px));
  }

  /* Vertical directions travel a shorter, fixed distance in non-overlap mode --
     today's own literal (20px), kept as its own value rather than forced onto
     `--distance-overlay`: that token replaces the old 500px "flying" default,
     and 20px was already reasonable (DESIGN_PRINCIPLES.md #1). Horizontal
     directions never varied with `overlapPage` before this migration (see the
     pre-migration `getAnimationConfig` switch), so they get no non-overlap
     override here either. */
  .toast.no-page-overlap[data-direction='bottom-to-top'] {
    --toast-enter-y: 20px;
  }
  .toast.no-page-overlap[data-direction='top-to-bottom'] {
    --toast-enter-y: -20px;
  }

  /* Accessibility guard, not a style preference -- `!important` is deliberate.
     It has to outrank both the direction rules above and any per-instance
     inline `--toast-enter-x`/`-y` the component sets from `inAnimationOffset`/
     `outAnimationOffset` above (an inline style otherwise beats any selector in
     this sheet). Duration floors at 0.05s rather than 0s so the
     `transitionend` listener that fires `ontoasthide` still runs -- a `0s`
     transition never starts, so it never ends, and (empirically, under heavy
     main-thread jank) even a 1ms duration can get coalesced across a single
     style recalc with no observable "before" frame, which drops
     `transitionend` the same way. 50ms clears a normal frame budget with
     margin while staying well under perceptible motion. See
     DESIGN_PRINCIPLES.md #1 on matching a guard's specificity to what it has
     to override. */
  @media (prefers-reduced-motion: reduce) {
    .toast,
    .toast.is-visible {
      --toast-enter-x: 0px !important;
      --toast-enter-y: 0px !important;
      transition-duration: 0.05s !important;
    }
  }

  .toast-icon-wrapper {
    display: flex;
    width: var(--toast-icon-wrapper-width, 20px);
    height: var(--toast-icon-wrapper-height, 20px);
    margin: var(--toast-icon-margin, 0px 6px 0px 0px);
    padding: var(--toast-icon-wrapper-padding, 1px);
    align-items: center;

    --image-height: var(--toast-icon-height, 100%);
    --image-width: fit-content;
    --image-filter: var(--toast-icon-filter, none);
    --image-border-radius: var(--toast-icon-border-radius, 50%);
  }

  .toast-message {
    display: var(--toast-message-display, flex);
    flex: var(--toast-message-flex, 1);
    padding: var(--toast-message-padding, 1px);
    flex-direction: column;
  }

  .toast-subtext {
    color: var(--toast-subtext-color, #c7c7c7);
    font-size: var(--toast-subtext-font-size, 10px);
    font-weight: var(--toast-subtext-font-weight, 400);
    margin: var(--toast-subtext-margin, 10px 0px 0px 0px);
  }

  .close-button {
    pointer-events: auto;
    width: var(--toast-close-button-width, 20px);
    height: var(--toast-close-button-height, 20px);
    cursor: var(--toast-close-button-cursor, pointer);
    gap: var(--toast-close-button-gap, 6px);
    margin: var(--toast-close-button-margin, 0px 0px 0px 10px);
    display: var(--toast-close-button-display, flex);
    align-items: var(--toast-close-button-align-items, center);
    justify-content: var(--toast-close-button-justify-content, center);
    padding: var(--toast-close-button-padding, 1px);

    --image-height: var(--toast-icon-height, 100%);
    --image-width: fit-content;
    --image-filter: var(--toast-icon-filter, none);
    --image-border-radius: var(--toast-icon-border-radius, 50%);
  }

  .success {
    color: var(--toast-success-text, #fff);
    background-color: var(--toast-success-background-color, var(--toast-background-color, #24aa5a));
    --toast-border: var(--toast-success-border);
  }

  .info {
    color: var(--toast-info-text, #fff);
    background-color: var(--toast-info-background-color, var(--toast-background-color, #87ceeb));
    --toast-border: var(--toast-info-border);
  }

  .warn {
    color: var(--toast-warn-text, #fff);
    background-color: var(--toast-warn-background-color, var(--toast-background-color, #f3a42d));
    --toast-border: var(--toast-warn-border);
  }

  .error {
    color: var(--toast-error-text, #fff);
    background-color: var(--toast-error-background-color, var(--toast-background-color, #f04438));
    --toast-border: var(--toast-error-border);
  }
</style>
