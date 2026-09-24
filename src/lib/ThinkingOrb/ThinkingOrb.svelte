<script lang="ts">
  import { onMount } from 'svelte';
  import { attract, GRAVITY_DEFAULTS, type GravityPointer } from './orb/gravity';
  import { paintFrame } from './orb/paint';
  import { MODES } from './orb/modes';
  import { prefersReducedMotion } from '../utils';
  import { parseCssColor } from '../VoiceOrb/orbMath';
  import type { Rgb } from '../types';
  import type {
    GravityOptions,
    OrbState,
    ThinkingOrbProperties,
    ThinkingOrbSize
  } from './properties';

  let {
    state: orbState = 'working',
    size = 64,
    speed = 1,
    paused = false,
    color,
    dots = 1,
    dotSize = 1,
    gravity = false,
    ariaLabel,
    classes,
    testId,
    onfirstframe
  }: ThinkingOrbProperties = $props();

  const SIZES: readonly ThinkingOrbSize[] = [64, 32, 20];
  const FALLBACK_TINT: Rgb = { r: 128, g: 128, b: 128 };
  /** A fixed, representative instant a reduced-motion orb holds — any single
   * frame works, since every mode is required to be non-blank at every `t`. */
  const REDUCED_MOTION_INSTANT = 2.4;
  /** The backing store never scales past this multiple of the CSS size, so a
   * very-high-density display can't push the canvas past a sane pixel budget. */
  const MAX_BACKING_SCALE = 2;

  // <sui-thinking-orb> passes `state`/`size` straight from string/number
  // attributes, so a value no mode or size knows about can reach here. Fall
  // back rather than let a missing MODES entry leave nothing drawn.
  const safeState: OrbState = $derived(Object.hasOwn(MODES, orbState) ? orbState : 'working');
  const safeSize: ThinkingOrbSize = $derived(SIZES.includes(size) ? size : 64);
  const density = $derived(Math.max(0.1, dots));
  const dotScale = $derived(Math.max(0.1, dotSize));

  /*
   * Gravity is motion: under reduced motion it is switched off outright
   * rather than merely un-animated, so a still frame never carries a pointer
   * pull a user asked motion to not see.
   */
  const gravityOptions = $derived.by((): GravityOptions | null => {
    if (!gravity || reducedMotion) {
      return null;
    }
    return gravity === true ? GRAVITY_DEFAULTS : gravity;
  });

  let canvas: HTMLCanvasElement | null = $state(null);
  /*
   * `reducedMotion`/`onScreen`/`tabVisible` feed `shouldRun` below (a
   * `$derived`), so they must be real `$state` for it to react when they
   * change. `dark` is `$state` for the same reason `draw` below reads it
   * synchronously inside the main `$effect` -- writing it must retrigger
   * that effect, otherwise a theme flip while the loop is stopped (paused,
   * or reduced motion, which paints exactly once) would leave the ink ramp
   * on the wrong theme for as long as the orb stays still. `pointer` is a
   * plain `let`, not `$state`: a still orb repaints explicitly on pointer
   * events (see `repaintIfStill`), and a running orb's loop already reads
   * the latest pointer every tick, so retriggering the whole effect on every
   * pointer move would only tear down and restart the loop for nothing.
   */
  let reducedMotion = $state(prefersReducedMotion());
  let onScreen = $state(true);
  let tabVisible = $state(true);
  let dark = $state(false);
  let announcedFirstFrame = false;
  let resolvedColorInput = '';
  let resolvedTint: Rgb = FALLBACK_TINT;
  let pointer: GravityPointer = null;
  let animationHandle = 0;
  /** The orb's own clock: speed-scaled seconds, starting at 0 on mount and
   * advancing only while the loop actually runs (see the main `$effect`). A
   * still orb simply stops touching it, so it holds the exact instant it
   * stopped at with no extra bookkeeping. */
  let clock = 0;

  const shouldRun = $derived(!paused && !reducedMotion && onScreen && tabVisible);

  /** What a still orb paints: the fixed instant under reduced motion, else
   * whatever `clock` last reached. */
  const heldInstant = (): number => (reducedMotion ? REDUCED_MOTION_INSTANT : clock);

  /*
   * Assigning an unparseable colour to `fillStyle` is a spec no-op, so the
   * candidate is tried against two different backgrounds and the results
   * compared -- agreement means the browser accepted and normalised it (see
   * VoiceOrb.svelte, which uses the same trick).
   */
  const normalizeColor = (context: CanvasRenderingContext2D, value: string): string | null => {
    if (value.length === 0) {
      return null;
    }
    const previous = context.fillStyle;
    context.fillStyle = '#000000';
    context.fillStyle = value;
    const onBlack = context.fillStyle;
    context.fillStyle = '#ffffff';
    context.fillStyle = value;
    const onWhite = context.fillStyle;
    context.fillStyle = previous;
    return typeof onBlack === 'string' && onBlack === onWhite ? onBlack : null;
  };

  const readColorInput = (
    target: HTMLCanvasElement
  ): { declared: string; inherited: string; key: string } => {
    const styles = getComputedStyle(target);
    const declared = styles.getPropertyValue('--sui-thinking-orb-color').trim();
    const inherited = styles.color.trim();
    return { declared, inherited, key: `${declared}|${inherited}` };
  };

  /** `color` prop wins outright; otherwise re-read via getComputedStyle, cached by the raw input string. */
  const resolveTint = (context: CanvasRenderingContext2D): Rgb => {
    if (color) {
      return color;
    }
    if (canvas === null) {
      return resolvedTint;
    }
    const { declared, inherited, key } = readColorInput(canvas);
    if (key === resolvedColorInput) {
      return resolvedTint;
    }
    resolvedColorInput = key;
    const normalized = normalizeColor(context, declared) ?? normalizeColor(context, inherited);
    resolvedTint = (normalized === null ? null : parseCssColor(normalized)) ?? FALLBACK_TINT;
    return resolvedTint;
  };

  /** A still orb has no running loop to pick up a moved pointer on its own,
   * so gravity repaints it directly; a running orb's loop already paints the
   * latest pointer every tick and needs no help here. */
  const repaintIfStill = (): void => {
    if (shouldRun || gravityOptions === null) {
      return;
    }
    draw(heldInstant());
  };

  const trackPointer = (event: PointerEvent): void => {
    if (canvas === null || !gravity) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    repaintIfStill();
  };

  const releasePointer = (): void => {
    pointer = null;
    repaintIfStill();
  };

  /** SSR renders with no `window`; the backing store is left at 1x until the
   * component actually mounts in a browser and can ask it for a real ratio. */
  const resolveBackingScale = (): number => {
    if (typeof window === 'undefined') {
      return 1;
    }
    return Math.min(MAX_BACKING_SCALE, window.devicePixelRatio ?? 1);
  };

  /** Paints one instant. `instant` is already speed-scaled seconds -- either
   * the orb's own running `clock` or the fixed reduced-motion instant. Safe
   * to call whether or not the loop is running. */
  const draw = (instant: number): void => {
    if (canvas === null) {
      return;
    }
    const context = canvas.getContext('2d');
    if (context === null) {
      return;
    }

    const dpr = resolveBackingScale();
    const backingPx = Math.round(safeSize * dpr);
    if (canvas.width !== backingPx || canvas.height !== backingPx) {
      canvas.width = backingPx;
      canvas.height = backingPx;
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const frame = MODES[safeState](instant, { size: safeSize, density, dotScale });
    const gOpts = gravityOptions;
    const painted = gOpts === null ? frame : attract(frame, pointer, gOpts);
    paintFrame(context, painted, { dark, tint: resolveTint(context) });

    if (!announcedFirstFrame) {
      announcedFirstFrame = true;
      onfirstframe?.();
    }
  };

  /*
   * Re-runs whenever `shouldRun` or anything the leading `draw` reads changes
   * (`safeState`, `safeSize`, `density`, `dotScale`, `gravityOptions`, `dark`,
   * `color`, `reducedMotion`, ...) -- Svelte tracks every reactive read inside
   * this body, including transitively through that synchronous `draw` call,
   * so a prop change tears down the previous rAF (the cleanup below) and
   * repaints from scratch with no dependency list to maintain by hand.
   *
   * `clock` itself is never read synchronously here, only inside the `loop`
   * closure below, which runs later from `requestAnimationFrame` -- so
   * advancing it never retriggers this effect. That's what lets `speed`
   * change the clock's rate starting next tick with no jump and no loop
   * restart: `loop` reads the live `speed` prop itself, every tick.
   */
  // eslint-disable-next-line no-restricted-syntax
  $effect(() => {
    // A still orb (paused, reduced motion or off screen) never touches
    // `clock`, so it simply holds whatever instant it last reached -- no
    // separate "was it frozen" bookkeeping needed. At least one frame is
    // always painted, so the canvas is never blank.
    draw(heldInstant());
    if (!shouldRun) {
      return;
    }
    // Reset on every (re)start of the loop, including a resume from
    // stillness: the first tick after a (re)start must not count the time
    // that passed before it, so it advances `clock` by zero and every tick
    // after that measures real elapsed time again.
    let previousFrameTime: number | null = null;
    const loop = (frameTime: number): void => {
      const deltaSeconds = previousFrameTime === null ? 0 : (frameTime - previousFrameTime) / 1000;
      previousFrameTime = frameTime;
      clock += deltaSeconds * speed;
      draw(clock);
      animationHandle = requestAnimationFrame(loop);
    };
    animationHandle = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationHandle);
  });

  onMount(() => {
    if (canvas === null) {
      return;
    }

    // Every optional platform API below follows the same shape: build it
    // when the browser exposes the constructor/method it needs, otherwise
    // leave the binding `null` so the optional-chaining calls below no-op.
    let intersectionObserver: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      intersectionObserver = new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
      });
      intersectionObserver.observe(canvas);
    }

    const onVisibilityChange = (): void => {
      tabVisible = document.visibilityState !== 'hidden';
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    /*
     * This repo's `ThemeSwitcher` stamps `data-theme="dark"` on
     * `document.documentElement` -- one attribute on one element -- so a
     * `MutationObserver` there alone catches every theme change. It exists
     * only to keep `paintFrame`'s `dark` argument current: the tint colour
     * itself comes from CSS, resolved in `resolveTint` above.
     */
    const readTheme = (): void => {
      dark = document.documentElement.getAttribute('data-theme') === 'dark';
    };
    readTheme();
    let themeObserver: MutationObserver | null = null;
    if (typeof MutationObserver !== 'undefined') {
      themeObserver = new MutationObserver(readTheme);
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
      });
    }

    const onMotionChange = (event: MediaQueryListEvent): void => {
      reducedMotion = event.matches;
    };
    let motionQuery: MediaQueryList | null = null;
    if (typeof window.matchMedia === 'function') {
      motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      motionQuery.addEventListener('change', onMotionChange);
    }

    /*
     * A still orb only repaints on its own when `dark` flips. A host that
     * transitions its `color` (this repo's own layout fades `body` across a
     * theme switch) leaves a just-frozen frame at the outgoing colour, with
     * nothing else to redraw it. Re-read once the transition lands and
     * repaint the same frozen instant if the resolved colour actually moved.
     * A running orb re-reads every frame already and needs none of this.
     */
    const onColorTransitionEnd = (event: TransitionEvent): void => {
      if (shouldRun || color || canvas === null) {
        return;
      }
      if (event.propertyName !== 'color' && event.propertyName !== '--sui-thinking-orb-color') {
        return;
      }
      if (readColorInput(canvas).key !== resolvedColorInput) {
        draw(heldInstant());
      }
    };
    document.addEventListener('transitionend', onColorTransitionEnd);

    return () => {
      intersectionObserver?.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      document.removeEventListener('transitionend', onColorTransitionEnd);
      themeObserver?.disconnect();
      motionQuery?.removeEventListener('change', onMotionChange);
    };
  });
</script>

<!-- The canvas is a picture with a label, not a control: the pointer handlers
     only feed the optional gravity effect and never act, so role="img" is
     accurate. -->
<!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role -->
<canvas
  bind:this={canvas}
  role="img"
  aria-label={ariaLabel ?? `${safeState.charAt(0).toUpperCase()}${safeState.slice(1)}…`}
  class={classes}
  data-pw={typeof testId === 'string' ? testId : null}
  style:width={`${safeSize}px`}
  style:height={`${safeSize}px`}
  style:display="block"
  onpointermove={trackPointer}
  onpointerleave={releasePointer}
  onpointercancel={releasePointer}
></canvas>
