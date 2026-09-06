<script lang="ts">
  import Button from '../Button/Button.svelte';
  import Img from '../Img/Img.svelte';
  import playSvg from '$lib/assets/play.svg?raw';
  import pauseSvg from '$lib/assets/pause.svg?raw';
  import volumeSvg from '$lib/assets/volume.svg?raw';
  import muteSvg from '$lib/assets/mute.svg?raw';
  import fullscreenSvg from '$lib/assets/fullscreen.svg?raw';
  import exitFullscreenSvg from '$lib/assets/exit-fullscreen.svg?raw';
  import Slider from '../Slider/Slider.svelte';
  import type { MediaPlayerProperties } from './properties';

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
    seekBar = false,
    timeDisplay = false,
    fullscreenButton = false,
    fullscreenIcon,
    exitFullscreenIcon,
    currentTime = $bindable(0),
    duration = $bindable(0),
    onplay,
    onpause,
    onvolumechange,
    onseek,
    ontimeupdate,
    onfullscreenchange,
    testId,
    classes
  }: MediaPlayerProperties = $props();

  // HTMLMediaElement.HAVE_METADATA. Named rather than inlined as 1, because `readyState >= 1`
  // at a call site reads like a truthiness check rather than a specific media state.
  const HAVE_METADATA = 1;
  // Below one frame at 60fps: small enough that a real host write always clears it, large
  // enough that float drift between the element's clock and the bound copy does not.
  const SEEK_EPSILON = 0.01;
  // The last position this component wrote to `currentTime`; see the sync effect below.
  let syncedTime = 0;
  // A host write that arrived before the element could accept it; applied once metadata is.
  let pendingSeek: number | null = null;

  let videoPlayer: HTMLVideoElement | null = $state(null);
  let container: HTMLDivElement | null = $state(null);
  let isFullscreen = $state(false);

  // Any of the three new controls puts something in the bottom row beyond the mute
  // button, which is what decides whether that row needs to lay out as a bar.
  const hasTransportRow = $derived(seekBar || timeDisplay || fullscreenButton);

  /**
   * `m:ss`, widening to `h:mm:ss` only once the media actually runs past an hour, so a
   * 40-second clip does not read `0:00:40`. A media element reports NaN for duration
   * until metadata arrives and Infinity for an open-ended stream; both format as `--:--`
   * rather than leaking the raw value into the UI.
   */
  function formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return '--:--';
    }
    const whole = Math.floor(seconds);
    const hours = Math.floor(whole / 3600);
    const minutes = Math.floor((whole % 3600) / 60);
    const secs = whole % 60;
    const padded = secs.toString().padStart(2, '0');
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${padded}`;
    }
    return `${minutes}:${padded}`;
  }

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

  function handleTimeUpdate(): void {
    if (videoPlayer === null) {
      return;
    }
    currentTime = videoPlayer.currentTime;
    syncedTime = currentTime;
    ontimeupdate?.(currentTime, duration);
  }

  function handleLoadedMetadata(): void {
    if (videoPlayer === null) {
      return;
    }
    duration = Number.isFinite(videoPlayer.duration) ? videoPlayer.duration : 0;
  }

  // `loadedmetadata` is a one-shot event, and a cached or fast-loading file reaches
  // HAVE_METADATA before hydration attaches the handler above -- measured, not supposed:
  // the element reported readyState 4 and duration 4 while the component still held 0.
  // Nothing fires it again, so a seek bar and clock that only listened would stay dead
  // for exactly the media that loaded well. Adopting what the element already knows when
  // it binds covers that case; the handler covers the slower one.
  // eslint-disable-next-line no-restricted-syntax
  $effect(() => {
    if (videoPlayer === null || videoPlayer.readyState < HAVE_METADATA) {
      return;
    }
    if (duration === 0 && Number.isFinite(videoPlayer.duration)) {
      duration = videoPlayer.duration;
    }
    if (pendingSeek !== null) {
      const length = duration > 0 ? duration : videoPlayer.duration;
      const clamped = Number.isFinite(length)
        ? Math.min(Math.max(pendingSeek, 0), length)
        : Math.max(pendingSeek, 0);
      pendingSeek = null;
      syncedTime = clamped;
      currentTime = clamped;
      videoPlayer.currentTime = clamped;
    }
  });

  /**
   * `currentTime` is bindable in both directions. Playback and scrubbing push outward
   * through the two functions above; this carries a host's own write inward, which is
   * what makes restoring a saved position work rather than merely look bound.
   *
   * `syncedTime` is a plain `let`, not `$state`, so writing it here does not re-run this
   * effect. Without that, every outward update would read back as an inward one and the
   * element would be re-seeked to the position it just reported -- a feedback loop that
   * stutters playback. Comparing against it means only a value this component did not
   * itself produce counts as a host write. `onseek` deliberately does not fire: a host
   * restoring a position is not a user scrubbing.
   */
  // eslint-disable-next-line no-restricted-syntax
  $effect(() => {
    const requested = currentTime;
    if (videoPlayer === null || Math.abs(requested - syncedTime) < SEEK_EPSILON) {
      return;
    }
    // Before HAVE_METADATA the element has no timeline to seek within: the length is
    // unknown, so the value cannot be clamped, and assigning currentTime is specified to
    // set a default start position rather than seek -- and throws outright in some
    // engines. Hold it and apply it when metadata arrives, which is the moment a restored
    // position becomes meaningful anyway.
    if (videoPlayer.readyState < HAVE_METADATA) {
      pendingSeek = requested;
      return;
    }
    const clamped =
      duration > 0 ? Math.min(Math.max(requested, 0), duration) : Math.max(requested, 0);
    syncedTime = clamped;
    videoPlayer.currentTime = clamped;
  });

  /**
   * Seeking writes the element directly rather than waiting for the bound value to
   * settle, so a drag scrubs while the pointer is still down. `onseek` fires only from
   * here, which is what separates a deliberate scrub from playback advancing on its own.
   */
  function handleSeek(value: number): void {
    if (videoPlayer === null || duration <= 0) {
      return;
    }
    const clamped = Math.min(Math.max(value, 0), duration);
    videoPlayer.currentTime = clamped;
    currentTime = clamped;
    syncedTime = clamped;
    onseek?.(clamped);
  }

  /**
   * The fullscreen element as seen from wherever this component actually lives. In the
   * web-component build the container sits inside a shadow root, and `document`
   * retargets `fullscreenElement` to the host (`<sui-media-player>`), never the container
   * itself -- so a plain document check reads false while genuinely fullscreen, leaving
   * the icon stuck and `onfullscreenchange` silent. A ShadowRoot exposes the same
   * accessor scoped to its own tree, which does resolve to the container.
   */
  function activeFullscreenElement(): Element | null {
    const root = container?.getRootNode();
    if (root instanceof ShadowRoot) {
      return root.fullscreenElement;
    }
    return document.fullscreenElement;
  }

  /**
   * Fullscreen is requested on the container, not the `<video>`. A fullscreen video
   * element paints over everything, taking the overlay's play, mute and seek controls
   * with it; the container keeps them on top of the media where they are usable.
   */
  async function toggleFullscreen(): Promise<void> {
    if (container === null) {
      return;
    }
    try {
      if (activeFullscreenElement() === null) {
        await container.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // A rejected request (denied by the browser, or no user gesture behind it) leaves
      // the player exactly as it was. `fullscreenchange` never fires, so `isFullscreen`
      // still describes reality and the button still offers the action that failed.
    }
  }

  // The only reliable signal for leaving fullscreen is the document's own event: Escape
  // and the browser's chrome both exit without going through the button above.
  // eslint-disable-next-line no-restricted-syntax
  $effect(() => {
    function syncFullscreen(): void {
      const nowFullscreen = container !== null && activeFullscreenElement() === container;
      if (nowFullscreen !== isFullscreen) {
        isFullscreen = nowFullscreen;
        onfullscreenchange?.(nowFullscreen);
      }
    }
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  });
</script>

<div
  bind:this={container}
  class="media-player {classes ?? ''}"
  class:fullscreen={isFullscreen}
  data-pw={typeof testId === 'string' ? testId : null}
>
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
      preload={hasTransportRow ? 'metadata' : null}
      onplay={handlePlay}
      onpause={handlePause}
      ontimeupdate={handleTimeUpdate}
      onloadedmetadata={handleLoadedMetadata}
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
        <div class="bottom-controls" class:transport={hasTransportRow}>
          {#if seekBar}
            <div class="seek" data-pw={typeof testId === 'string' ? `${testId}-seek` : null}>
              <Slider
                value={currentTime}
                min={0}
                max={duration > 0 ? duration : 1}
                step={0.1}
                disabled={duration <= 0}
                oninput={handleSeek}
                onchange={handleSeek}
                ariaLabel="Seek"
              />
            </div>
          {/if}
          {#if timeDisplay}
            <span class="time" data-pw={typeof testId === 'string' ? `${testId}-time` : null}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          {/if}
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
          {#if fullscreenButton}
            <div
              class="control bottom-control"
              data-pw={typeof testId === 'string' ? `${testId}-fullscreen` : null}
            >
              <Button
                onclick={toggleFullscreen}
                ariaLabel={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {#if isFullscreen}
                  {#if typeof exitFullscreenIcon === 'function'}
                    {@render exitFullscreenIcon()}
                  {:else}
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    {@html exitFullscreenSvg}
                  {/if}
                {:else if typeof fullscreenIcon === 'function'}
                  {@render fullscreenIcon()}
                {:else}
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                  {@html fullscreenSvg}
                {/if}
              </Button>
            </div>
          {/if}
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

  /* With a seek bar, time or fullscreen present the row becomes a transport bar: the
     seek bar takes the free space and the rest sit beside it, centred on each other. */
  .bottom-controls.transport {
    justify-content: var(--media-player-transport-justify, flex-start);
    align-items: center;
    gap: var(--media-player-transport-gap, 12px);
  }

  .seek {
    flex: 1;
    min-width: 0;
    --slider-track-color: var(--media-player-seek-track-color, #ffffff59);
    --slider-fill-color: var(--media-player-seek-fill-color, #ffffff);
    --slider-thumb-color: var(--media-player-seek-thumb-color, #ffffff);
  }

  .time {
    flex-shrink: 0;
    font-family: var(--media-player-time-font-family, inherit);
    font-size: var(--media-player-time-font-size, 12px);
    font-variant-numeric: tabular-nums;
    color: var(--media-player-time-color, #ffffff);
    white-space: nowrap;
  }

  /* In fullscreen the container is the fullscreen element, so it must fill the screen
     rather than keep the fixed height a page layout gave it. */
  .media-player.fullscreen {
    height: 100%;
    width: 100%;
    background: var(--media-player-fullscreen-background, #000000);
  }

  .media-player.fullscreen .media {
    height: 100%;
    width: 100%;
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
