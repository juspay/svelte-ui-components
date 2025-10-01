<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import type { Snippet } from 'svelte';

  type ModalAlign = 'top' | 'bottom' | 'none';
  type ModalTransition = 'IN' | 'ALL' | 'NONE';

  type Props = {
    enable: boolean;
    align: ModalAlign;
    transitionType: ModalTransition;
    children: Snippet;
  };

  const { enable = true, align = 'bottom', transitionType = 'ALL', children }: Props = $props();

  const fadeAnimationProperties = { duration: 300 };

  const flyAnimationProperties = $derived(() => {
    const base = { x: 0, y: 0, duration: 380 };
    if (align === 'top') return { ...base, y: -30 };
    if (align === 'bottom') return { ...base, y: 300 };
    return base;
  });
</script>

{#if enable}
  {#if align === 'top' || align === 'bottom'}
    {#if transitionType === 'IN'}
      <div in:fly|global={flyAnimationProperties()}>
        {@render children()}
      </div>
    {:else if transitionType === 'ALL'}
      <div in:fly|global={flyAnimationProperties()} out:fly|global={flyAnimationProperties()}>
        {@render children()}
      </div>
    {:else}
      <div>
        {@render children()}
      </div>
    {/if}
  {:else if transitionType === 'IN'}
    <div in:fade|global={fadeAnimationProperties}>
      {@render children()}
    </div>
  {:else if transitionType === 'ALL'}
    <div in:fade|global={fadeAnimationProperties} out:fade|global={fadeAnimationProperties}>
      {@render children()}
    </div>
  {:else}
    <div>
      {@render children()}
    </div>
  {/if}
{:else}
  <div>
    {@render children()}
  </div>
{/if}
