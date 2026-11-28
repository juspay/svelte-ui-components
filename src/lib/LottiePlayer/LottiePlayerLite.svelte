<script lang="ts">
  import LottiePlayerCore from './LottiePlayerCore.svelte';
  import type { LottiePlayerLiteProperties } from './properties';

  let props: LottiePlayerLiteProperties = $props();
  let player = $state<LottiePlayerCore | null>(null);

  const loadPlayer = () =>
    import('lottie-web/build/player/lottie_light.js').then((module) => {
      const player = module.default ?? module;
      player.setIDPrefix('sui-lottie-light-');
      return player;
    });

  export function play(): void {
    player?.play();
  }

  export function pause(): void {
    player?.pause();
  }

  export function stop(): void {
    player?.stop();
  }
</script>

<LottiePlayerCore {...props} bind:this={player} renderer="svg" {loadPlayer} />
