<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import type { ModalAlign } from '$lib/Modal/properties';
  import type { ModalTransition } from '$lib/types';

  type Props = {
    enable?: boolean;
    align?: ModalAlign;
    transitionType?: ModalTransition;
    children?: Snippet;
  };

  let { enable = true, align = 'bottom', transitionType = 'ALL', children }: Props = $props();

  let flyAnimationProperties = $derived.by(() => {
    const base = { x: 0, y: 0, duration: 380 };

    switch (align) {
      case 'top':
        return { ...base, y: -30 };
      case 'bottom':
        return { ...base, y: 300 };
      default:
        return base;
    }
  });

  let fadeAnimationProperties = { duration: 300 };

  let useFlyAnimation = $derived(align === 'top' || align === 'bottom');
  let useOutTransition = $derived(transitionType === 'ALL');
</script>

{#if enable}
  {#if useFlyAnimation}
    <div
      in:fly|global={flyAnimationProperties}
      out:fly|global={useOutTransition ? flyAnimationProperties : undefined}
    >
      {@render children?.()}
    </div>
  {:else}
    <div
      in:fade|global={fadeAnimationProperties}
      out:fade|global={useOutTransition ? fadeAnimationProperties : undefined}
    >
      {@render children?.()}
    </div>
  {/if}
{:else}
  {@render children?.()}
{/if}
