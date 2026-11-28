<svelte:options runes={false} />

<script lang="ts">
  import { replayBoundProps } from '../compat';
  import { fly, fade } from 'svelte/transition';
  import type { ModalAlign } from '../Modal/properties';
  import type { ModalTransition } from '../types';
  export let enable = true;
  export let align: ModalAlign = 'bottom';
  export let transitionType: ModalTransition = 'ALL';

  replayBoundProps({
    enable: () => {
      enable = enable;
    },
    align: () => {
      align = align;
    },
    transitionType: () => {
      transitionType = transitionType;
    }
  });

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
