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
  <!-- Same latent bug as Toast.svelte's `in:fly`: `fadeIn` (like Toast's
       `showToast`) is whatever the caller passes on this component's own
       first render, so a local `in:` would never play when a caller mounts
       with `fadeIn` already true -- exactly the "fades in on mount" case
       this prop exists for (see docs/OverlayAnimation.md). `|global` makes
       the intro play on creation regardless. -->
  <div
    in:fade|global={{ duration: 350 }}
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
