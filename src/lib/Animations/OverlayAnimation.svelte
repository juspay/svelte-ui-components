<script lang="ts">
  import { fade } from 'svelte/transition';
  import type { Snippet } from 'svelte';

  type Props = {
    children?: Snippet;
    testId?: string;
    /** When true, fades in on mount (same 350ms duration as the existing fade-out). Default false preserves the current instant-appear behavior. */
    fadeIn?: boolean;
  };

  let { children, testId, fadeIn = false }: Props = $props();
</script>

{#if fadeIn}
  <div
    in:fade={{ duration: 350 }}
    out:fade={{ duration: 350 }}
    data-pw={typeof testId === 'string' ? testId : null}
    testID={typeof testId === 'string' ? testId : null}
  >
    {@render children?.()}
  </div>
{:else}
  <div
    out:fade={{ duration: 350 }}
    data-pw={typeof testId === 'string' ? testId : null}
    testID={typeof testId === 'string' ? testId : null}
  >
    {@render children?.()}
  </div>
{/if}
