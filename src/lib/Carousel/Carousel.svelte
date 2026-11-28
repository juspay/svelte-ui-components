<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '../Button/Button.svelte';
  import type { CarouselProperties } from './properties';

  let {
    views,
    autoplay = false,
    autoplayInterval = 1000,
    showDots = false,
    isScrollableLast = false,
    onkeydown,
    classes,
    testId,
    dotsWrapperTestId,
    dotTestId
  }: CarouselProperties = $props();

  let rotationRequested = $state(true);
  let hovered = $state(false);
  let requestedSlide = $state(0);
  let activeSlideIndex = $derived(Math.min(requestedSlide, Math.max(0, views.length - 1)));
  let canAdvance = $derived(
    views.length > 1 && (isScrollableLast || activeSlideIndex < views.length - 1)
  );
  let rotating = $derived(autoplay && rotationRequested && canAdvance && !hovered);
  let rotationEnabled = $derived(autoplay && rotationRequested && canAdvance);

  function reconcileSelection(): void {
    // Forget a removed slide so a later append does not silently select it again.
    if (requestedSlide !== activeSlideIndex) {
      requestedSlide = activeSlideIndex;
    }
  }

  function moveSlideBy(step: number): void {
    if (views.length < 2) {
      return;
    }
    const next = activeSlideIndex + step;
    if (next >= 0 && next < views.length) {
      requestedSlide = next;
    } else if (isScrollableLast) {
      requestedSlide = (next + views.length) % views.length;
    } else {
      return;
    }
  }

  function scheduleRotation(): () => void {
    if (!rotating) {
      return () => {};
    }
    const position = activeSlideIndex;
    const timer = window.setTimeout(() => {
      if (rotating && activeSlideIndex === position) {
        moveSlideBy(1);
      }
    }, autoplayInterval);
    return () => window.clearTimeout(timer);
  }

  function toggleRotation(): void {
    if (rotationEnabled) {
      rotationRequested = false;
      return;
    }
    if (!canAdvance) {
      requestedSlide = 0;
    }
    rotationRequested = true;
  }

  function stopForKeyboardFocus(event: FocusEvent): void {
    if (event.target instanceof Element && event.target.matches(':focus-visible')) {
      rotationRequested = false;
    }
  }

  function attachGestures(target: HTMLDivElement): () => void {
    let startTouch: number | null = null;
    let startMouse: number | null = null;

    function swipe(start: number | null, end: number): void {
      if (start === null || Math.abs(start - end) <= 20) {
        return;
      }
      const direction = getComputedStyle(target).direction === 'rtl' ? -1 : 1;
      moveSlideBy(end < start ? direction : -direction);
    }

    function handleTouchStart(event: TouchEvent): void {
      startTouch = event.touches.item(0)?.clientX ?? null;
    }

    function handleTouchEnd(event: TouchEvent): void {
      const touch = event.changedTouches.item(0);
      if (touch !== null) {
        swipe(startTouch, touch.clientX);
      }
      clearTouch();
    }

    function clearTouch(): void {
      startTouch = null;
    }

    function handleMouseDown(event: MouseEvent): void {
      startMouse = event.clientX;
    }

    function handleMouseUp(event: MouseEvent): void {
      swipe(startMouse, event.clientX);
      startMouse = null;
    }

    target.addEventListener('touchstart', handleTouchStart);
    target.addEventListener('touchend', handleTouchEnd);
    target.addEventListener('touchcancel', clearTouch);
    target.addEventListener('mousedown', handleMouseDown);
    target.addEventListener('mouseup', handleMouseUp);
    return () => {
      target.removeEventListener('touchstart', handleTouchStart);
      target.removeEventListener('touchend', handleTouchEnd);
      target.removeEventListener('touchcancel', clearTouch);
      target.removeEventListener('mousedown', handleMouseDown);
      target.removeEventListener('mouseup', handleMouseUp);
    };
  }

  onMount(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    function syncReducedMotion(): void {
      if (media.matches) {
        rotationRequested = false;
      }
    }
    syncReducedMotion();
    media.addEventListener('change', syncReducedMotion);
    return () => media.removeEventListener('change', syncReducedMotion);
  });

  function suspendOnInteraction(node: HTMLDivElement): () => void {
    function enter(event: PointerEvent): void {
      if (event.pointerType === 'mouse') {
        hovered = true;
      }
    }
    function leave(event: PointerEvent): void {
      if (event.pointerType === 'mouse') {
        hovered = false;
      }
    }
    node.addEventListener('focusin', stopForKeyboardFocus);
    node.addEventListener('pointerenter', enter);
    node.addEventListener('pointerleave', leave);
    return () => {
      node.removeEventListener('focusin', stopForKeyboardFocus);
      node.removeEventListener('pointerenter', enter);
      node.removeEventListener('pointerleave', leave);
    };
  }
</script>

<div
  class="carousel-container {classes ?? ''}"
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
  {@attach reconcileSelection}
  {@attach scheduleRotation}
  {@attach suspendOnInteraction}
>
  {#if autoplay && views.length > 1}
    <div class="rotation-controls">
      <Button
        text={rotationEnabled ? 'Pause rotation' : 'Start rotation'}
        onclick={toggleRotation}
      />
    </div>
  {/if}
  {#if views.length > 0}
    <div class="carousel" {@attach attachGestures}>
      <div class="slidesDiv" style:--slide-index={activeSlideIndex}>
        {#each views as view, index (index)}
          <div class="current-slide">
            <!-- Spread is the real fix: every component in this library takes named
                 props, so passing the bag under a single `properties` key meant a
                 normal slide rendered empty. `properties` is ALSO still passed so
                 that a consumer who built a purpose-made wrapper around the old
                 behaviour keeps working -- that wrapper was the only shape this
                 component was usable with before, and breaking it would force a
                 major bump for a fix that is otherwise additive. Deprecated: read
                 the named props, not `properties`. -->
            <view.component {...view.properties} properties={view.properties} />
          </div>
        {/each}
      </div>
    </div>
  {/if}
  {#if showDots}
    <div
      class="dots-wrapper"
      data-pw={typeof dotsWrapperTestId === 'string' ? dotsWrapperTestId : null}
      testID={typeof dotsWrapperTestId === 'string' ? dotsWrapperTestId : null}
    >
      <!-- eslint-disable-next-line -->
      {#each views as _, index}
        <div
          class={activeSlideIndex === index ? 'active-dot' : 'dot'}
          onclick={() => (requestedSlide = index)}
          onkeydown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              requestedSlide = index;
            }
            onkeydown?.(event);
          }}
          role="button"
          tabindex="0"
          aria-label={`Go to slide ${index + 1}`}
          aria-current={activeSlideIndex === index ? 'true' : null}
          data-pw={typeof dotTestId === 'string' ? `${dotTestId}-${index + 1}` : null}
          testID={typeof dotTestId === 'string' ? `${dotTestId}-${index + 1}` : null}
        ></div>
      {/each}
    </div>
  {/if}
  <div class="carousel-live-region" aria-live={rotating ? 'off' : 'polite'} aria-atomic="true">
    {#if views.length > 0}Slide {activeSlideIndex + 1} of {views.length}{/if}
  </div>
</div>

<style>
  .carousel-container {
    /* Without a width token the outer box fills its host, as it did before.
       The viewport keeps its 300px fallback and the dots follow the outer box. */
    width: var(--carousel-width);
    max-width: 100%;
  }
  .current-slide {
    flex: 0 0 100%;
    min-width: 0;
    height: var(--carousel-height, 100px);
  }
  .carousel {
    box-shadow: var(--carousel-shadow);
    height: var(--carousel-height, 100px);
    width: var(--carousel-width, 300px);
    max-width: 100%;
    overflow: hidden;
    border-radius: var(--carousel-border-radius, 0%);
  }
  .carousel:active {
    cursor: grabbing;
  }
  .slidesDiv {
    display: flex;
    /* The track and slide share the viewport width, so translation follows resizing.
       In LTR the logical end resets right to zero. In RTL the negative right
       inset outweighs the leftward transform and sends the track right instead. */
    position: relative;
    right: calc(-200% * var(--slide-index, 0));
    inset-inline-end: 0;
    transform: translateX(calc(-100% * var(--slide-index, 0)));
    transition-property: transform, right;
    transition-duration: var(--carousel-track-transition-duration, var(--motion-duration, 0.5s));
    transition-timing-function: var(
      --carousel-track-transition-easing,
      var(--motion-easing, ease-in-out)
    );
  }
  /* The track slide is the component's motion. The dots below transition only
     `background`, which is a colour change rather than movement, so they are
     deliberately left alone -- silencing them would remove feedback the
     preference never asked to remove. Finite, so dropping it lands the track on
     the slide it was moving to. */
  @media (prefers-reduced-motion: reduce) {
    .slidesDiv {
      transition: none;
    }
  }

  .rotation-controls {
    display: flex;
    margin-block-end: 8px;
  }

  .dots-wrapper {
    gap: max(0px, calc(var(--dot-gap, 10px) + var(--dot-width, 5px) - 24px));
    padding-top: var(--dot-padding-top, 10px);
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
  }

  .dot,
  .active-dot {
    display: grid;
    place-items: center;
    min-inline-size: 24px;
    width: max(24px, var(--dot-width, 5px));
    height: max(24px, var(--dot-height, 5px));
    cursor: pointer;
    transition: background var(--carousel-dot-transition-duration, var(--motion-duration, 0.3s))
      var(--carousel-dot-transition-easing, var(--motion-easing, ease));
  }

  .dot::before,
  .active-dot::before {
    content: '';
    width: var(--dot-width, 5px);
    height: var(--dot-height, 5px);
    border-radius: 50%;
    background: var(--carousel-dot-color, #c4c4c4);
    transition: inherit;
  }

  .active-dot::before {
    background: var(--carousel-dot-active-color, #000000);
  }

  .dot:focus-visible,
  .active-dot:focus-visible {
    outline: var(--dot-focus-outline, 2px solid #000000);
    outline-offset: var(--dot-focus-outline-offset, 2px);
  }
  /*
  @media only screen and (max-width: 324px) {

    .carousel-container {
      width:270px;

    }
    .current-slide {
    width: 270px;
    }
    .carousel {
      width:270px;
    }
  }

  @media only screen and (max-width: 269px) {
    .carousel-container {
      width:240px;
    }
    .current-slide {
    width: 240px;
    }
    .carousel {
      width:240px;
    }

  } */

  /* Visually hidden but readable by assistive tech -- the standard clip pattern
     rather than display:none, which would remove it from the a11y tree. */
  .carousel-live-region {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }
</style>
