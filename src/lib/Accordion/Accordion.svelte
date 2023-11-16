<script lang="ts">
  import { afterUpdate, onMount } from 'svelte';

  export let expand = false;
  let maxHeight = 0;
  let accordionRef: HTMLElement;

  function updateMaxHeight() {
    if (expand) {
      accordionRef.style.maxHeight = `${maxHeight}px`;
    } else {
      accordionRef.style.maxHeight = '0';
    }
  }

  afterUpdate(updateMaxHeight);

  onMount(() => {
    accordionRef.style.transition = 'max-height 0.2s ease-out';
    updateMaxHeight();
  });

  $: {
    if (accordionRef) {
      maxHeight = accordionRef.scrollHeight;
      updateMaxHeight();
    }
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
