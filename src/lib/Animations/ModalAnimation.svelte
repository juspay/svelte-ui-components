<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import type { ModalAlign } from '$lib/Modal/properties';
  export let enable = true;
  export let align: ModalAlign = 'bottom';

  let flyAnimationProperties = { x: 0, y: 0, duration: 380 };
  let fadeAnimationProperties = { duration: 300 };
  switch (align) {
    case 'top':
      flyAnimationProperties = { ...flyAnimationProperties, y: -30 };
      break;
    case 'bottom':
      flyAnimationProperties = { ...flyAnimationProperties, y: 300 };
      break;
  }
</script>

{#if enable}
  {#if align === 'top' || align === 'bottom'}
    <div transition:fly={flyAnimationProperties}>
      <slot />
    </div>
  {:else}
    <div in:fade={fadeAnimationProperties} out:fade={fadeAnimationProperties}>
      <slot />
    </div>
  {/if}
{:else}
  <slot />
{/if}
