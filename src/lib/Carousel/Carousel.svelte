<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
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

  let slidesDiv: HTMLDivElement | null = $state(null);
  let intervalId: number;
  let endTouch: number;
  let startTouch: number;
  let startMouse: number;
  let endMouse: number;
  let carouselWidth: string;
  let carouselDiv: HTMLDivElement | null = $state(null);
  let activeSlideIndex = $state(0);
  let widthUnits: string;

  function nextSlide() {
    if (activeSlideIndex != views.length - 1 || isScrollableLast) {
      activeSlideIndex++;
      changeCurrentSlide();
      if (autoplay) {
        resetInterval();
      }
    }
  }

  function previousSlide() {
    if (activeSlideIndex != 0 || isScrollableLast) {
      activeSlideIndex--;
      changeCurrentSlide();
      if (autoplay) {
        resetInterval();
      }
    }
  }

  function changeCurrentSlide() {
    if (activeSlideIndex > views.length - 1) {
      activeSlideIndex = 0;
    } else if (activeSlideIndex < 0) {
      activeSlideIndex = views.length - 1;
    }
    if (slidesDiv) {
      slidesDiv.style.transform = `translateX(${
        -activeSlideIndex * parseInt(carouselWidth)
      }${widthUnits})`;
    }
  }

  function moveSlideToIndex(index: number) {
    activeSlideIndex = index;
    changeCurrentSlide();
  }

  function resetInterval() {
    clearInterval(intervalId);
    intervalId = window.setInterval(nextSlide, autoplayInterval);
  }

  function handleTouchStart(event: TouchEvent) {
    if (event.touches.length > 0) {
      const touch = event.touches.item(0);
      if (touch !== null) {
        startTouch = touch.clientX;
      }
    }
  }

  function handleTouchEnd(event: TouchEvent) {
    if (event.changedTouches.length > 0) {
      const changedTouch = event.changedTouches.item(0);
      if (changedTouch !== null) {
        endTouch = changedTouch.clientX;
        if (startTouch - endTouch > 20) {
          nextSlide();
        } else {
          if (endTouch - startTouch > 20) {
            previousSlide();
          }
        }
      }
    }
  }

  function handleMouseDown(event: MouseEvent) {
    if (typeof event.clientX !== 'undefined') {
      startMouse = event.clientX;
    }
  }

  function handeMouseUp(event: MouseEvent) {
    if (typeof event.clientX !== 'undefined') {
      endMouse = event.clientX;
      if (startMouse - endMouse > 20) {
        nextSlide();
      } else {
        if (endMouse - startMouse > 20) {
          previousSlide();
        }
      }
    }
  }

  function setWidthUnit(carouselWidth: string) {
    widthUnits = carouselWidth.slice(-3);
    if (/^-?\d+$/.test(widthUnits.at(0) ?? '')) {
      widthUnits = widthUnits.slice(-2);
    }
  }

  onMount(() => {
    if (carouselDiv) {
      carouselWidth = getComputedStyle(carouselDiv).getPropertyValue('--carousel-width');
      setWidthUnit(carouselWidth);
      carouselDiv.addEventListener('touchstart', handleTouchStart);
      carouselDiv.addEventListener('touchend', handleTouchEnd);
      carouselDiv.addEventListener('mousedown', handleMouseDown);
      carouselDiv.addEventListener('mouseup', handeMouseUp);
    }
    if (autoplay) {
      intervalId = window.setInterval(nextSlide, autoplayInterval);
    }
  });

  onDestroy(() => {
    if (carouselDiv) {
      carouselDiv.removeEventListener('touchstart', handleTouchStart);
      carouselDiv.removeEventListener('touchend', handleTouchEnd);
      carouselDiv.removeEventListener('mousedown', handleMouseDown);
      carouselDiv.removeEventListener('mouseup', handeMouseUp);
    }
    if (autoplay) {
      clearInterval(intervalId);
    }
  });
</script>

<div
  class="carousel-container {classes ?? ''}"
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  {#if views.length > 0}
    <div class="carousel" bind:this={carouselDiv}>
      <div class="slidesDiv" bind:this={slidesDiv}>
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
          class={activeSlideIndex == index ? 'active-dot' : 'dot'}
          onclick={() => moveSlideToIndex(index)}
          onkeydown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              moveSlideToIndex(index);
            }
            onkeydown?.(event);
          }}
          role="button"
          tabindex="0"
          aria-label={`Go to slide ${index + 1}`}
          data-pw={typeof dotTestId === 'string' ? `${dotTestId}-${index + 1}` : null}
          testID={typeof dotTestId === 'string' ? `${dotTestId}-${index + 1}` : null}
        ></div>
      {/each}
    </div>
  {/if}
  <!-- Slide changes are silent to assistive tech otherwise: the dots announce
       where they GO, but nothing announces where the carousel ARRIVED, whether
       the move came from autoplay, a swipe or a dot. polite so it never
       interrupts, and atomic so the whole position is read as one phrase. -->
  <div class="carousel-live-region" aria-live="polite" aria-atomic="true">
    {#if views.length > 0}Slide {activeSlideIndex + 1} of {views.length}{/if}
  </div>
</div>

<style>
  .carousel-container {
    width: var(--carousel-width);
  }
  .current-slide {
    width: var(--carousel-width, 300px);
    height: var(--carousel-height, 100px);
    flex-shrink: 0;
  }
  .carousel {
    box-shadow: var(--carousel-shadow);
    height: var(--carousel-height, 100px);
    width: var(--carousel-width, 300px);
    overflow: hidden;
    border-radius: var(--carousel-border-radius, 0%);
  }
  .carousel:active {
    cursor: grabbing;
  }
  .slidesDiv {
    display: flex;
    transform: translateX(0);
    transition: transform 0.5s ease-in-out;
  }
  .dots-wrapper {
    gap: var(--dot-gap, 10px);
    padding-top: var(--dot-padding-top, 10px);
    display: flex;
    justify-content: center;
  }
  .dot {
    width: var(--dot-width, 5px);
    height: var(--dot-height, 5px);
    border-radius: 50%;
    background: var(--carousel-dot-color, #c4c4c4);
    cursor: pointer;
    transition: 0.3s ease;
  }

  .active-dot {
    width: var(--dot-width, 5px);
    height: var(--dot-height, 5px);
    border-radius: 50%;
    cursor: pointer;
    background: var(--carousel-dot-active-color, #000000);
    transition: 0.3s ease;
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
