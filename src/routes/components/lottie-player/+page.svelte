<script lang="ts">
  import '../_capability-demo-controls.css';
  import { base } from '$app/paths';
  import { LottiePlayer } from '$lib';
  import animationData from './motion.json';

  let player: LottiePlayer | null = $state(null);
  let loop = $state(false);
  let speed = $state(1);
  let playbackState = $state('Loading animation');
  let unavailable = $state(false);
  let ready = $state(false);
  let resetCount = $state(0);

  function observeDrawing(node: HTMLDivElement): { destroy: () => void } {
    ready = false;
    playbackState = unavailable ? 'Loading unavailable animation' : 'Loading animation';
    const syncReady = (): void => {
      ready = (node.querySelector('svg path')?.getAttribute('d')?.length ?? 0) > 0;
      if (ready && playbackState.startsWith('Loading')) {
        playbackState = 'Ready';
      }
    };
    const observer = new MutationObserver(syncReady);
    observer.observe(node, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['d', 'transform']
    });
    syncReady();
    return { destroy: () => observer.disconnect() };
  }
</script>

<div class="page-header">
  <span class="category-badge">Media</span>
  <h1>LottiePlayer</h1>
</div>
<p>
  A local animation with playback controls. Turning loop on or off starts a fresh, paused player.
  Show load error requests an unavailable local file; Reset animation restores the preview.
</p>

<div class="demo-row">
  <div class="animation" role="img" aria-label="Animation preview">
    {#key `${loop}-${unavailable}-${resetCount}`}
      <div class="player-host" use:observeDrawing>
        <LottiePlayer
          bind:this={player}
          {...unavailable
            ? { src: `${base}/demo-media/unavailable-animation.json` }
            : { animationData }}
          {loop}
          {speed}
          autoplay={false}
          testId="lottie-demo"
          oncomplete={() => (playbackState = 'Completed')}
          onerror={() => (playbackState = 'Animation could not load')}
        />
      </div>
    {/key}
  </div>
</div>
<div class="controls">
  <button
    type="button"
    class="capability-demo-button"
    disabled={!ready}
    onclick={() => {
      if (playbackState === 'Completed') {
        player?.stop();
      }
      player?.play();
      playbackState = 'Playing';
    }}>Play animation</button
  >
  <button
    type="button"
    class="capability-demo-button"
    disabled={!ready}
    onclick={() => {
      player?.pause();
      playbackState = 'Paused';
    }}>Pause animation</button
  >
  <button
    type="button"
    class="capability-demo-button"
    disabled={!ready}
    onclick={() => {
      player?.stop();
      playbackState = 'Stopped';
    }}>Stop animation</button
  >
  <div class="field-control">
    <label for="lottie-speed">Playback speed</label>
    <select id="lottie-speed" bind:value={speed}
      ><option value={0.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option
      ></select
    >
  </div>
  <label><input type="checkbox" bind:checked={loop} /> Loop animation</label>
  <button
    type="button"
    class="capability-demo-button"
    onclick={() => {
      unavailable = true;
    }}>Show load error</button
  >
  <button
    type="button"
    class="capability-demo-button"
    onclick={() => {
      unavailable = false;
      resetCount += 1;
    }}>Reset animation</button
  >
</div>
<p role="status" data-pw="lottie-status">{playbackState}</p>

<style>
  .animation {
    width: 240px;
    height: 120px;
    border: 1px solid var(--doc-border);
    border-radius: 8px;
    background: #ffffff;
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }
  .player-host {
    width: 100%;
    height: 100%;
  }
  label,
  .field-control {
    display: flex;
    align-items: center;
    gap: 8px;
  }
</style>
