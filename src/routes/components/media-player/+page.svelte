<script lang="ts">
  import { base } from '$app/paths';
  import MediaPlayer from '$lib/MediaPlayer/MediaPlayer.svelte';
  import Button from '$lib/Button/Button.svelte';

  // Two separate players/toggles, each exercising one direction of the bindable contract
  // from a clean initial state -- easier to reason about (and to test) than one player
  // doing both directions in sequence.
  let playingA = $state(true);
  let playingB = $state(false);

  // The transport demo reads its own bindables back out, so the page shows the same
  // numbers the component is working from rather than a second copy of the state.
  let transportTime = $state(0);
  let transportDuration = $state(0);
  let lastSeek = $state(-1);
  let fullscreenState = $state(false);
  // Paused on load: the transport demo is about position, and a player advancing on its
  // own makes "did the seek move it" unanswerable.
  let transportPlaying = $state(false);
</script>

<div class="page-header">
  <span class="category-badge">Media</span>
  <h1>MediaPlayer</h1>
</div>

<div class="demo-row media-stage">
  <MediaPlayer
    type="video"
    src="{base}/demo-media/promo-clip.mp4"
    testId="media-player-video-demo"
  />

  <MediaPlayer
    type="image"
    src="{base}/demo-media/sunset-beach.jpg"
    alt="Sunset over the ocean"
    testId="media-player-image-demo"
  />

  <MediaPlayer
    type="video"
    src="{base}/demo-media/promo-clip.mp4"
    controls
    testId="media-player-native-controls-demo"
  />

  <MediaPlayer
    type="video"
    src="{base}/demo-media/promo-clip.mp4"
    captionsSrc="{base}/demo-media/promo-clip.vtt"
    captionsLabel="English"
    captionsSrcLang="en"
    testId="media-player-captions-demo"
  />

  <MediaPlayer
    type="video"
    src="{base}/demo-media/promo-clip.mp4"
    bind:playing={playingA}
    testId="media-player-external-pause-demo"
  />

  <MediaPlayer
    type="video"
    src="{base}/demo-media/promo-clip.mp4"
    autoplay={false}
    bind:playing={playingB}
    testId="media-player-external-play-demo"
  />

  <MediaPlayer
    type="video"
    src="{base}/demo-media/promo-clip.mp4"
    autoplay={false}
    muted
    bind:playing={transportPlaying}
    seekBar
    timeDisplay
    fullscreenButton
    bind:currentTime={transportTime}
    bind:duration={transportDuration}
    onseek={(time) => (lastSeek = time)}
    onfullscreenchange={(isFullscreen) => (fullscreenState = isFullscreen)}
    testId="media-player-transport-demo"
  />
</div>

<div class="demo-row">
  <span data-pw="transport-readout">
    currentTime={transportTime.toFixed(1)} duration={transportDuration.toFixed(1)} lastSeek={lastSeek.toFixed(
      1
    )} fullscreen={String(fullscreenState)}
  </span>
</div>

<div class="demo-row">
  <Button
    text="Pause the first player via bind:playing"
    onclick={() => (playingA = false)}
    testId="external-pause-toggle"
  />
  <Button
    text="Play the second player via bind:playing"
    onclick={() => (playingB = true)}
    testId="external-play-toggle"
  />
  <Button
    text="Restore the transport player to 2.5s via bind:currentTime"
    onclick={() => (transportTime = 2.5)}
    testId="external-seek-toggle"
  />
</div>

<p class="demo-note">
  <code>controls</code> (third player above): native browser controls, so the custom overlay and its
  <code>role="button"</code>/keyboard handling on the video element are both omitted — native
  controls already provide full keyboard operability, and layering a second interaction model on top
  of them would conflict rather than help.
</p>

<p class="demo-note">
  Fifth and sixth players + the buttons below the grid: neither button touches its video element
  directly — each only flips a plain <code>$state</code> bound to <code>playing</code>, same as any
  host component would. The players react on their own and actually pause/play.
</p>

<p class="demo-note">
  Seventh player above: <code>seekBar</code>, <code>timeDisplay</code> and
  <code>fullscreenButton</code> are each opt-in, so a player that showed only play and mute keeps
  showing only play and mute. The readout beneath the grid is bound to that player's own
  <code>currentTime</code> and <code>duration</code>, and records the last <code>onseek</code>
  position, so the numbers on the page are the component's rather than a copy.
</p>

<p class="demo-note">
  <code>captionsSrc</code> (fourth player above): only renders a <code>&lt;track&gt;</code> when
  real caption data is supplied. Omitting <code>captionsSrc</code> renders no track at all, rather than
  an empty, non-functional one.
</p>

<style>
  .media-stage {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .media-stage :global(.media-player) {
    width: 320px;
  }
</style>
