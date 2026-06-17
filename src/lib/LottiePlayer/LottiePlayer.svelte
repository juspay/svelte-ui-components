<script lang="ts">
  import { onMount } from 'svelte';
  import type { AnimationItem } from 'lottie-web';
  import type { LottiePlayerProperties } from './properties';

  type LocalAnimationItem = Pick<
    AnimationItem,
    'play' | 'pause' | 'stop' | 'destroy' | 'setSpeed' | 'addEventListener' | 'removeEventListener'
  >;

  let {
    src,
    animationData,
    autoplay = true,
    loop = true,
    speed = 1,
    renderer = 'svg',
    ariaHidden = true,
    testId,
    classes,
    oncomplete,
    onerror
  }: LottiePlayerProperties = $props();

  let containerEl: HTMLDivElement | null = $state(null);
  let animationItem: LocalAnimationItem | null = $state(null);

  let rootClass = $derived(['lottie-player', classes ?? ''].filter((c) => c.length > 0).join(' '));

  export function play(): void {
    animationItem?.play();
  }

  export function pause(): void {
    animationItem?.pause();
  }

  export function stop(): void {
    animationItem?.stop();
  }

  // eslint-disable-next-line no-restricted-syntax
  $effect(() => {
    if (animationItem !== null) {
      animationItem.setSpeed(speed);
    }
  });

  onMount(() => {
    if (containerEl === null) {
      return;
    }

    let item: LocalAnimationItem | null = null;

    const handleComplete = (): void => {
      oncomplete?.();
    };

    const handleError = (): void => {
      onerror?.();
    };

    void import('lottie-web').then((lottie) => {
      if (containerEl === null) {
        return;
      }

      const lottieApi = lottie.default ?? lottie;

      const config: Parameters<typeof lottieApi.loadAnimation>[0] = {
        container: containerEl,
        renderer,
        loop,
        autoplay,
        ...(animationData != null
          ? { animationData }
          : typeof src === 'string' && src.length > 0
            ? { path: src }
            : {})
      };

      const loaded = lottieApi.loadAnimation(config);
      item = loaded;
      animationItem = item;

      loaded.setSpeed(speed);

      loaded.addEventListener('complete', handleComplete);
      loaded.addEventListener('data_failed', handleError);
    });

    return () => {
      if (item !== null) {
        item.removeEventListener('complete', handleComplete);
        item.removeEventListener('data_failed', handleError);
        item.destroy();
        animationItem = null;
      }
    };
  });
</script>

<div
  class={rootClass}
  bind:this={containerEl}
  aria-hidden={ariaHidden ? 'true' : null}
  role={ariaHidden ? null : 'img'}
  data-pw={typeof testId === 'string' ? testId : null}
></div>

<style>
  .lottie-player {
    display: var(--lottie-player-display, inline-block);
    width: var(--lottie-player-width, 100%);
    height: var(--lottie-player-height, 100%);
    background: var(--lottie-player-background, transparent);
    border-radius: var(--lottie-player-border-radius, 0px);
    overflow: var(--lottie-player-overflow, hidden);
  }
</style>
