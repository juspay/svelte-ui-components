<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { prefersReducedMotion } from '../utils';
  import type { ModalAlign, ModalEntryAnimation } from '$lib/Modal/properties';
  import type { ModalTransition } from '$lib/types';

  type Props = {
    enable?: boolean;
    align?: ModalAlign;
    transitionType?: ModalTransition;
    entryAnimation?: ModalEntryAnimation;
    children?: Snippet;
    testId?: string;
  };

  let {
    enable = true,
    align = 'bottom',
    transitionType = 'ALL',
    entryAnimation,
    children,
    testId
  }: Props = $props();

  let flyAnimationProperties = $derived.by(() => {
    const base = { x: 0, y: 0, duration: 380 };

    // Both the distance and the duration go to zero, and the distance is the part
    // that matters: `fly` interpolates towards 0, so duration 0 with y still at 300
    // paints the modal 300px off-target on its first frame and then snaps. Returning
    // `base` unchanged is exactly "appear in place" -- it already has x and y at 0 --
    // so only the duration needs zeroing alongside it. These values feed
    // `in:fly|global={...}`, which no stylesheet can reach, so the guard is here.
    if (prefersReducedMotion()) {
      return { ...base, duration: 0 };
    }

    // entryAnimation, when set, overrides the align-based default below —
    // e.g. a centered modal (which normally fades) can opt into the same
    // fly distances top/bottom alignment already use.
    if (entryAnimation === 'slide-up') {
      return { ...base, y: 300 };
    }
    if (entryAnimation === 'slide-down') {
      return { ...base, y: -30 };
    }

    switch (align) {
      case 'top':
        return { ...base, y: -30 };
      case 'bottom':
        return { ...base, y: 300 };
      default:
        return base;
    }
  });

  // The fade is opacity-only, so it is not the movement the preference targets --
  // but it is still an animation, and the cheapest honest thing is to drop it too
  // rather than argue the distinction at every call site.
  let fadeAnimationProperties = $derived({ duration: prefersReducedMotion() ? 0 : 300 });

  let useFlyAnimation = $derived(
    entryAnimation != null ? entryAnimation !== 'fade' : align === 'top' || align === 'bottom'
  );
  let useOutTransition = $derived(transitionType === 'ALL');
</script>

{#if enable}
  {#if useFlyAnimation && useOutTransition}
    <div
      in:fly|global={flyAnimationProperties}
      out:fly|global={flyAnimationProperties}
      data-pw={typeof testId === 'string' ? testId : null}
      testID={typeof testId === 'string' ? testId : null}
    >
      {@render children?.()}
    </div>
  {:else if useFlyAnimation}
    <div
      in:fly|global={flyAnimationProperties}
      data-pw={typeof testId === 'string' ? testId : null}
      testID={typeof testId === 'string' ? testId : null}
    >
      {@render children?.()}
    </div>
  {:else if useOutTransition}
    <div
      in:fade|global={fadeAnimationProperties}
      out:fade|global={fadeAnimationProperties}
      data-pw={typeof testId === 'string' ? testId : null}
      testID={typeof testId === 'string' ? testId : null}
    >
      {@render children?.()}
    </div>
  {:else}
    <div
      in:fade|global={fadeAnimationProperties}
      data-pw={typeof testId === 'string' ? testId : null}
      testID={typeof testId === 'string' ? testId : null}
    >
      {@render children?.()}
    </div>
  {/if}
{:else}
  {@render children?.()}
{/if}
