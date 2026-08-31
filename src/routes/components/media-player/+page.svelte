<script lang="ts">
  import { base } from '$app/paths';
  import MediaPlayer from '$lib/MediaPlayer/MediaPlayer.svelte';
  import Button from '$lib/Button/Button.svelte';

  // Two separate players/toggles, each exercising one direction of the bindable contract
  // from a clean initial state -- easier to reason about (and to test) than one player
  // doing both directions in sequence.
  let playingA = $state(true);
  let playingB = $state(false);
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
