<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { CarouselProperties } from './properties';
  import { defaultCarouselProperties } from './properties';
  export let properties: CarouselProperties = defaultCarouselProperties;

  let slidesDiv: HTMLDivElement | undefined;
  let intervalId: number;
  let endTouch: number;
  let startTouch: number;
  let startMouse: number;
  let endMouse: number;
  let carouselWidth: string;
  let carouselDiv: HTMLDivElement | undefined;
  let activeSlideIndex = 0;
  let widthUnits: string;

  function nextSlide() {
    if (activeSlideIndex != properties.views.length - 1 || properties.isScrollableLast) {
      activeSlideIndex++;
      changeCurrentSlide();
      if (properties.autoplay) {
        resetInterval();
      }
    }
  }

  function previousSlide() {
    if (activeSlideIndex != 0 || properties.isScrollableLast) {
      activeSlideIndex--;
      changeCurrentSlide();
      if (properties.autoplay) {
        resetInterval();
      }
    }
  }

  function changeCurrentSlide() {
    if (activeSlideIndex > properties.views.length - 1) {
      activeSlideIndex = 0;
    } else if (activeSlideIndex < 0) {
      activeSlideIndex = properties.views.length - 1;
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
    intervalId = window.setInterval(nextSlide, properties.autoplayInterval);
  }

  function handleTouchStart(event: TouchEvent) {
    if (event.touches && Object.keys(event.touches).length > 0) {
      if (event.touches[0] && typeof event.changedTouches[0].clientX !== 'undefined') {
        startTouch = event.touches[0].clientX;
      }
    }
  }

  function handleTouchEnd(event: TouchEvent) {
    if (event.changedTouches && Object.keys(event.changedTouches).length > 0) {
      if (event.changedTouches[0] && typeof event.changedTouches[0].clientX !== 'undefined') {
        endTouch = event.changedTouches[0].clientX;
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
    if (event && Object.keys(event).length > 0 && typeof event.clientX !== 'undefined') {
      startMouse = event.clientX;
    }
  }

  function handeMouseUp(event: MouseEvent) {
    if (event && Object.keys(event).length > 0 && typeof event.clientX !== 'undefined') {
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
    if (/^-?\d+$/.test(widthUnits[0])) {
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
    if (properties.autoplay) {
      intervalId = window.setInterval(nextSlide, properties.autoplayInterval);
    }
  });

  onDestroy(() => {
    if (properties.autoplay) {
      clearInterval(intervalId);
    }
  });
</script>

<div class="carousel-container">
  {#if properties.views.length}
    <div class="carousel" bind:this={carouselDiv}>
      <div class="slidesDiv" bind:this={slidesDiv}>
        {#each properties.views as view}
          <div class="current-slide">
            {#if view.properties}
              <svelte:component this={view.component} properties={view.properties} />
            {:else}
              <svelte:component this={view.component} />
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
  {#if properties.showDots}
    <div class="dots-wrapper">
      <!-- eslint-disable-next-line -->
      {#each properties.views as _, index}
        <div
          class={activeSlideIndex == index ? 'active-dot' : 'dot'}
          on:click={() => moveSlideToIndex(index)}
          on:keydown
          role="none"
        />
      {/each}
    </div>
  {/if}
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
    background: #c4c4c4;
    cursor: pointer;
    transition: 0.3s ease;
  }

  .active-dot {
    width: var(--dot-width, 5px);
    height: var(--dot-height, 5px);
    border-radius: 50%;
    cursor: pointer;
    background: #000000;
    transition: 0.3s ease;
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
</style>
