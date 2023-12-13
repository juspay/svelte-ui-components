<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import type { ModalAlign } from '$lib/Modal/properties';
  import type { ModalTransition } from '$lib/types';
  export let enable = true;
  export let align: ModalAlign = 'bottom';
  export let transitionType: ModalTransition = 'ALL';

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
    {#if transitionType === 'IN'}
      <div in:fly|global={flyAnimationProperties}>
        <slot />
      </div>
    {:else}
      <div in:fly|global={flyAnimationProperties} out:fly|global={flyAnimationProperties}>
        <slot />
      </div>
    {/if}
  {:else if transitionType === 'IN'}
    <div in:fade|global={fadeAnimationProperties}>
      <slot />
    </div>
  {:else}
    <div in:fade|global={fadeAnimationProperties} out:fade|global={fadeAnimationProperties}>
      <slot />
    </div>
  {/if}
{:else}
  <slot />
{/if}
