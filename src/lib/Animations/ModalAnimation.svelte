<script lang="ts">
  import type { Snippet } from 'svelte';
  import { linear } from 'svelte/easing';
  import { tokenizedFly } from './tokenizedFly';
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
    // `in:tokenizedFly|global={...}`: x/y at 0 stay exactly 0 regardless of any
    // distance token (tokenizedFly preserves a 0 rather than resizing it). A
    // consumer-set duration token can no longer revive motion here either --
    // tokenizedFly's own reduced-motion backstop (reducedMotion.current) clamps
    // duration to near-zero regardless of what any token chain resolves to.
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

  // Open/close get distinct duration tokens (the literal fallback stays 380 both
  // ways, matching flyAnimationProperties today) so a consumer can set an
  // asymmetric close duration without this component inventing that gap itself.
  // The fade-shaped branches below reuse the same token names: exactly one of
  // the four template branches renders per instance, so "content-open" means
  // the same thing to a consumer whether this instance flies or fades in.
  // Each token array is element-token -> --motion-duration/-easing root, skipping
  // a named tier: 380ms/300ms don't match any named duration tier, consistent
  // with every other agent in this batch skipping non-matching literals rather
  // than forcing one. --distance-overlay is the named tier both fly branches
  // share (60px, this batch's Modal/Sheet travel-distance reduction).
  let flyInParams = $derived({
    x: flyAnimationProperties.x,
    y: flyAnimationProperties.y,
    durationTokens: ['--modal-content-open-transition-duration', '--motion-duration'],
    fallbackDuration: flyAnimationProperties.duration,
    distanceTokens: ['--modal-content-open-transition-distance', '--distance-overlay'],
    fallbackDistance: 60,
    easingTokens: ['--modal-content-open-transition-easing', '--ease-smooth-out', '--motion-easing']
  });
  let flyOutParams = $derived({
    x: flyAnimationProperties.x,
    y: flyAnimationProperties.y,
    durationTokens: ['--modal-content-close-transition-duration', '--motion-duration'],
    fallbackDuration: flyAnimationProperties.duration,
    distanceTokens: ['--modal-content-close-transition-distance', '--distance-overlay'],
    fallbackDistance: 60,
    easingTokens: [
      '--modal-content-close-transition-easing',
      '--ease-smooth-out',
      '--motion-easing'
    ]
  });
  // No distanceTokens: these branches are opacity-only, same as fade's own
  // params today. `easing` stays the ultimate JS fallback -- tokenizedFly
  // otherwise defaults to cubicOut (fly's default), fade's own default is
  // linear -- used only if no easingTokens entry resolves either.
  let fadeInParams = $derived({
    durationTokens: ['--modal-content-open-transition-duration', '--motion-duration'],
    fallbackDuration: fadeAnimationProperties.duration,
    easingTokens: [
      '--modal-content-open-transition-easing',
      '--ease-smooth-out',
      '--motion-easing'
    ],
    easing: linear
  });
  let fadeOutParams = $derived({
    durationTokens: ['--modal-content-close-transition-duration', '--motion-duration'],
    fallbackDuration: fadeAnimationProperties.duration,
    easingTokens: [
      '--modal-content-close-transition-easing',
      '--ease-smooth-out',
      '--motion-easing'
    ],
    easing: linear
  });

  let useFlyAnimation = $derived(
    entryAnimation != null ? entryAnimation !== 'fade' : align === 'top' || align === 'bottom'
  );
  let useOutTransition = $derived(transitionType === 'ALL');
</script>

{#if enable}
  {#if useFlyAnimation && useOutTransition}
    <div
      in:tokenizedFly|global={flyInParams}
      out:tokenizedFly|global={flyOutParams}
      data-pw={typeof testId === 'string' ? testId : null}
      testID={typeof testId === 'string' ? testId : null}
    >
      {@render children?.()}
    </div>
  {:else if useFlyAnimation}
    <div
      in:tokenizedFly|global={flyInParams}
      data-pw={typeof testId === 'string' ? testId : null}
      testID={typeof testId === 'string' ? testId : null}
    >
      {@render children?.()}
    </div>
  {:else if useOutTransition}
    <div
      in:tokenizedFly|global={fadeInParams}
      out:tokenizedFly|global={fadeOutParams}
      data-pw={typeof testId === 'string' ? testId : null}
      testID={typeof testId === 'string' ? testId : null}
    >
      {@render children?.()}
    </div>
  {:else}
    <div
      in:tokenizedFly|global={fadeInParams}
      data-pw={typeof testId === 'string' ? testId : null}
      testID={typeof testId === 'string' ? testId : null}
    >
      {@render children?.()}
    </div>
  {/if}
{:else}
  {@render children?.()}
{/if}
