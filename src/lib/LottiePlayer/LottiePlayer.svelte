<script lang="ts">
  import LottiePlayerCore from './LottiePlayerCore.svelte';
  import type { LottiePlayerProperties } from './properties';

  let props: LottiePlayerProperties = $props();
  let player = $state<LottiePlayerCore | null>(null);

  const loadPlayer = () => import('lottie-web').then((module) => module.default ?? module);

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

<LottiePlayerCore {...props} bind:this={player} {loadPlayer} />
