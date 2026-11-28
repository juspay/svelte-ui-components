<svelte:options runes={false} />

<script lang="ts">
  import { replayBoundProps } from '../compat';
  import { onMount } from 'svelte';

  export let expand = false;

  replayBoundProps({
    expand: () => {
      expand = expand;
    }
  });
  let maxHeight = 0;
  let mounted = false;
  let accordionRef: HTMLDivElement;

  function updateMaxHeight() {
    try {
      if (expand) {
        accordionRef.style.maxHeight = `${maxHeight}px`;
      } else {
        accordionRef.style.maxHeight = '0';
      }
    } catch (e) {
      console.error('Error while updating style of accordian', e);
    }
  }

  /**
   * The content height, measured with any accordion nested inside at its final height.
   *
   * 1.34.1 measured while a nested accordion was still animating open, so how much of the nested
   * one it counted depended on machine speed: 54, 59 and 64 px for the same page across runs.
   * Pausing the nested transitions for the read gives the settled value every time, which is what
   * 1.34.1 also produced on a slow device. A nested accordion skips its own 0.2s opening animation
   * as a result; the parent's animation still runs.
   */
  function measureSettledHeight(): number {
    const nested = [...accordionRef.querySelectorAll<HTMLElement>('.accordion')];
    const transitions = nested.map((element) => element.style.transition);
    for (const element of nested) {
      element.style.transition = 'none';
    }
    const height = accordionRef.scrollHeight;
    nested.forEach((element, index) => {
      element.style.transition = transitions[index];
    });
    return height;
  }

  // 1.34.1 measured the content from a `$:` block that re-ran once `bind:this` resolved, and
  // re-applied the height from `afterUpdate`. That pair never settles on Svelte 5 (the page hangs),
  // so the same steps run here in the same order: apply with the height still 0, measure once,
  // apply again. The content is measured once, as before, and is not re-measured when it grows.
  onMount(() => {
    accordionRef.style.transition = 'max-height 0.2s ease-out';
    updateMaxHeight();
    maxHeight = measureSettledHeight();
    updateMaxHeight();
    mounted = true;
    // Svelte 4 re-ran this component's update whenever the slot content changed, and that update
    // re-applied the measured height; an accordion created empty grew when its content arrived.
    // Svelte 5 updates slot content without touching this component, so watch the content instead.
    const observer = new MutationObserver(() => {
      maxHeight = measureSettledHeight();
      updateMaxHeight();
    });
    observer.observe(accordionRef, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  });

  function applyExpand(_expand: boolean) {
    updateMaxHeight();
  }

  $: if (mounted) {
    applyExpand(expand);
  }
</script>

<div class="accordion" bind:this={accordionRef}>
  <slot />
</div>

<style>
  .accordion {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0s ease-in;
  }
</style>
