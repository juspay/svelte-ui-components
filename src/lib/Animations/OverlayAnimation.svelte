<script lang="ts">
  import { linear } from 'svelte/easing';
  import type { Snippet } from 'svelte';
  import { tokenizedFly } from './tokenizedFly';

  type Props = {
    children?: Snippet;
    testId?: string;
    /** When true, fades in on mount (same 350ms duration as the existing fade-out). Default false preserves the current instant-appear behavior. */
    fadeIn?: boolean;
  };

  let { children, testId, fadeIn = false }: Props = $props();

  // Opacity-only, so no distanceTokens; easing is explicit because tokenizedFly
  // otherwise defaults to cubicOut (fly's default) -- fade's own default is
  // linear, and this replaces a fade. No reduced-motion guard here, matching
  // today's fade calls below, which never had one either. No named duration
  // tier: this component's easing was deliberately left untokenized (never
  // part of the original brief -- a pure background-scrim fade doesn't
  // warrant a new, unvalidated easing decision), and 350ms wasn't treated as
  // evidence for a recurring named tier on its own. The chain still ends at
  // --motion-duration, though: Overlay mounts in lockstep with ModalAnimation
  // (both are children of the same Modal), so leaving the root out would let
  // a consumer's "everything N% faster" override speed up the content panel
  // while the backdrop fade stayed put -- a visibly half-tokenized common case,
  // not a scope boundary worth preserving.
  const openParams = {
    durationTokens: ['--modal-overlay-open-transition-duration', '--motion-duration'],
    fallbackDuration: 350,
    easing: linear
  };
  const closeParams = {
    durationTokens: ['--modal-overlay-close-transition-duration', '--motion-duration'],
    fallbackDuration: 350,
    easing: linear
  };
</script>

{#if fadeIn}
  <!-- Same latent bug as Toast.svelte's `in:fly`: `fadeIn` (like Toast's
       `showToast`) is whatever the caller passes on this component's own
       first render, so a local `in:` would never play when a caller mounts
       with `fadeIn` already true -- exactly the "fades in on mount" case
       this prop exists for (see docs/OverlayAnimation.md). `|global` makes
       the intro play on creation regardless. -->
  <div
    in:tokenizedFly|global={openParams}
    out:tokenizedFly={closeParams}
    data-pw={typeof testId === 'string' ? testId : null}
    testID={typeof testId === 'string' ? testId : null}
  >
    {@render children?.()}
  </div>
{:else}
  <div
    out:tokenizedFly={closeParams}
    data-pw={typeof testId === 'string' ? testId : null}
    testID={typeof testId === 'string' ? testId : null}
  >
    {@render children?.()}
  </div>
{/if}
