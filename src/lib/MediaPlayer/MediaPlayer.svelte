<script lang="ts">
  import Button from '../Button/Button.svelte';
  import Img from '../Img/Img.svelte';
  import playSvg from '$lib/assets/play.svg?raw';
  import pauseSvg from '$lib/assets/pause.svg?raw';
  import volumeSvg from '$lib/assets/volume.svg?raw';
  import muteSvg from '$lib/assets/mute.svg?raw';
  import type { MediaPlayerProperties } from './properties';
  import { readDeprecatedProps, resolveDeprecatedProp } from '../deprecation';

  let {
    src,
    type,
    alt = '',
    autoplay = true,
    loop = false,
    controls = false,
    fallback,
    playing = $bindable(true),
    muted = $bindable(true),
    playIcon,
    pauseIcon,
    muteIcon,
    unmuteIcon,
    captionsSrc,
    captionsLabel,
    captionsSrcLang,
    onplay,
    onpause,
    onvolumechange: onvolumechangeProp,
    onVolumeChange,
    testId,
    classes
  }: MediaPlayerProperties = $props();

  // Every spelling this component still accepts resolves to one value; the lowercase one wins.
  const onvolumechange = $derived(
    resolveDeprecatedProp(
      'MediaPlayer',
      'onVolumeChange',
      'onvolumechange',
      onVolumeChange,
      onvolumechangeProp
    )
  );

  // Read once at mount so an old spelling is reported even if the event never fires.
  $effect.pre(() => {
    readDeprecatedProps(onvolumechange);
  });

  let videoPlayer: HTMLVideoElement | null = $state(null);

  function togglePlayback(): void {
    if (videoPlayer === null) {
      return;
    }
    if (videoPlayer.paused) {
      videoPlayer.play();
    } else {
      videoPlayer.pause();
    }
  }

  // `playing` is bindable so a host can drive playback externally (e.g. pausing this
  // player when another one starts), but the native onplay/onpause handlers below only
  // ever WRITE to it (video state -> playing). Without this, a host setting playing
  // itself had no effect on the actual video at all. Guarded so it only imperatively
  // calls play()/pause() when the DOM element's real state actually disagrees with
  // `playing` -- the native events settle it back in sync afterwards, so this can't loop.
  // eslint-disable-next-line no-restricted-syntax
  $effect(() => {
    if (videoPlayer === null) {
      return;
    }
    if (playing && videoPlayer.paused) {
      videoPlayer.play();
    } else if (!playing && !videoPlayer.paused) {
      videoPlayer.pause();
    }
  });

  function toggleMute(): void {
    muted = !muted;
    onvolumechange?.(muted);
  }

  function handlePlay(event: Event): void {
    playing = true;
    onplay?.(event);
  }

  function handlePause(event: Event): void {
    playing = false;
    onpause?.(event);
  }

  function handleVideoKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      togglePlayback();
    }
  }
</script>

<div class="media-player {classes ?? ''}" data-pw={typeof testId === 'string' ? testId : null}>
  {#if type === 'image'}
    <span class="media-image">
      <Img {src} {alt} {fallback} />
    </span>
  {:else}
    <video
      bind:this={videoPlayer}
      bind:muted
      {src}
      class="media"
      {controls}
      {autoplay}
      {loop}
      playsinline
      onplay={handlePlay}
      onpause={handlePause}
      onclick={controls ? null : togglePlayback}
      onkeydown={controls ? null : handleVideoKeydown}
      role={controls ? null : 'button'}
      tabindex={controls ? null : 0}
      aria-label={controls ? null : playing ? 'Pause video' : 'Play video'}
    >
      {#if typeof captionsSrc === 'string' && captionsSrc.length > 0}
        <track
          kind="captions"
          src={captionsSrc}
          label={typeof captionsLabel === 'string' ? captionsLabel : null}
          srclang={typeof captionsSrcLang === 'string' ? captionsSrcLang : null}
        />
      {/if}
    </video>

    {#if !controls}
      <div class="overlay">
        <div class="center-controls">
          <div class="control center-control">
            <Button onclick={togglePlayback} ariaLabel={playing ? 'Pause video' : 'Play video'}>
              {#if playing}
                {#if typeof pauseIcon === 'function'}
                  {@render pauseIcon()}
                {:else}
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                  {@html pauseSvg}
                {/if}
              {:else if typeof playIcon === 'function'}
                {@render playIcon()}
              {:else}
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html playSvg}
              {/if}
            </Button>
          </div>
        </div>
        <div class="bottom-controls">
          <div class="control bottom-control">
            <Button onclick={toggleMute} ariaLabel={muted ? 'Unmute' : 'Mute'}>
              {#if muted}
                {#if typeof muteIcon === 'function'}
                  {@render muteIcon()}
                {:else}
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                  {@html muteSvg}
                {/if}
              {:else if typeof unmuteIcon === 'function'}
                {@render unmuteIcon()}
              {:else}
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html volumeSvg}
              {/if}
            </Button>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .media-player {
    box-sizing: border-box;
    display: flex;
    position: relative;
    height: var(--media-player-height, 400px);
    width: var(--media-player-width, fit-content);
    border-radius: var(--media-player-border-radius, 14px);
    overflow: var(--media-player-overflow, hidden);
    background: var(--media-player-background, transparent);
  }

  .media {
    height: var(--media-player-media-height, 100%);
    width: var(--media-player-media-width, fit-content);
    object-fit: var(--media-player-media-object-fit, contain);
    border-radius: var(--media-player-media-border-radius, inherit);
    display: block;
  }

  video.media {
    cursor: var(--media-player-media-cursor, pointer);
  }

  .media-image {
    display: contents;
    --image-height: var(--media-player-media-height, 100%);
    --image-width: var(--media-player-media-width, fit-content);
    --image-object-fit: var(--media-player-media-object-fit, contain);
    --image-border-radius: var(--media-player-media-border-radius, 0px);
    --image-padding: 0px;
    --image-margin: 0px;
  }

  .overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    z-index: var(--media-player-overlay-z-index, 20);
    border-radius: inherit;
    background-color: var(--media-player-overlay-color, transparent);
    transition: var(--media-player-overlay-transition, background-color 0.2s ease);
    --center-controls-visibility: var(--media-player-center-controls-visibility, hidden);
    --bottom-controls-visibility: var(--media-player-bottom-controls-visibility, hidden);
  }

  /* :focus-within alongside :hover so the overlay controls (play/pause, mute) are
     reachable for keyboard users too -- :hover alone left them visibility:hidden (and
     so out of the tab order) for anyone not using a mouse. */
  .overlay:hover,
  .overlay:focus-within {
    background-color: var(--media-player-overlay-hover-color, #0000004d);
    --center-controls-visibility: visible;
    --bottom-controls-visibility: visible;
  }

  .center-controls {
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
    visibility: var(--center-controls-visibility);
  }

  .bottom-controls {
    display: flex;
    width: 100%;
    height: fit-content;
    justify-content: var(--media-player-bottom-controls-justify, flex-end);
    box-sizing: border-box;
    padding: var(--media-player-bottom-controls-padding, 12px);
    visibility: var(--bottom-controls-visibility);
  }

  .control {
    --button-padding: var(--media-player-control-padding, 0px);
    --button-border: var(--media-player-control-border, none);
    --button-border-radius: var(--media-player-control-border-radius, 50%);
    --button-color: var(--media-player-control-background-color, transparent);
    --button-text-color: var(--media-player-control-color, #ffffff);
    --button-content-gap: 0px;
    --button-hover-color: var(
      --media-player-control-hover-background-color,
      var(--media-player-control-background-color, transparent)
    );
    --button-hover-text-color: var(
      --media-player-control-hover-color,
      var(--media-player-control-color, #ffffff)
    );
  }

  .center-control {
    --button-width: var(--media-player-center-control-size, 64px);
    --button-height: var(--media-player-center-control-size, 64px);
  }

  .bottom-control {
    --button-width: var(--media-player-bottom-control-size, 24px);
    --button-height: var(--media-player-bottom-control-size, 24px);
  }

  .control :global(svg),
  .control :global(img) {
    height: var(--media-player-control-icon-size, 100%);
    width: var(--media-player-control-icon-size, 100%);
    object-fit: contain;
  }
</style>
