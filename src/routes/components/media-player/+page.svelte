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

  // The captions demo is user-driven on purpose: it starts paused so the viewer decides when
  // playback (and therefore the cues) begin, and loops so the 4-second clip never runs out
  // from under someone who is still finding the toggle. `captionsVisible` is bound so the
  // readout shows the component's own state rather than a second copy, and `lastCaptionChange`
  // records what the viewer did (a host write deliberately does not set it).
  let captionsPlaying = $state(false);
  let captionsOn = $state(false);
  let lastCaptionChange = $state('none');
  // The native-controls player carries the same track, so the browser's own captions menu
  // (not drawn by this library) is what changes it; the bound value follows whatever that
  // menu chooses.
  let nativeCaptionsOn = $state(false);
</script>

<div class="page-header">
  <span class="category-badge">Media</span>
  <h1>MediaPlayer</h1>
</div>

<div class="demo-row media-stage">
  <MediaPlayer
    ariaLabel="Custom controls video"
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
    ariaLabel="Native controls video"
    type="video"
    src="{base}/demo-media/promo-clip.mp4"
    controls
    captionsSrc="{base}/demo-media/promo-clip.vtt"
    captionsLabel="English"
    captionsSrcLang="en"
    bind:captionsVisible={nativeCaptionsOn}
    classes="fit-video"
    testId="media-player-native-controls-demo"
  />

  <MediaPlayer
    ariaLabel="Captioned video"
    type="video"
    src="{base}/demo-media/promo-clip.mp4"
    captionsSrc="{base}/demo-media/promo-clip.vtt"
    captionsLabel="English"
    captionsSrcLang="en"
    captionsButton
    autoplay={false}
    loop
    bind:playing={captionsPlaying}
    bind:captionsVisible={captionsOn}
    oncaptionschange={(visible) => (lastCaptionChange = visible ? 'shown' : 'hidden')}
    classes="fit-video"
    testId="media-player-captions-demo"
  />

  <MediaPlayer
    ariaLabel="Externally paused video"
    type="video"
    src="{base}/demo-media/promo-clip.mp4"
    bind:playing={playingA}
    testId="media-player-external-pause-demo"
  />

  <MediaPlayer
    ariaLabel="Externally played video"
    type="video"
    src="{base}/demo-media/promo-clip.mp4"
    autoplay={false}
    bind:playing={playingB}
    testId="media-player-external-play-demo"
  />

  <MediaPlayer
    ariaLabel="Transport controls video"
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
  <span data-pw="captions-readout">
    captionsVisible={String(captionsOn)} lastCaptionChange={lastCaptionChange}
  </span>
  <span data-pw="native-captions-readout"> nativeCaptionsVisible={String(nativeCaptionsOn)} </span>
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
  <Button
    text="Toggle the captions player's captions via bind:captionsVisible"
    onclick={() => (captionsOn = !captionsOn)}
    testId="external-captions-toggle"
  />
</div>

<p class="demo-note">
  <code>controls</code> (third player above): native browser controls, so the custom overlay and its
  <code>role="button"</code>/keyboard handling on the video element are both omitted — native
  controls already provide full keyboard operability, and layering a second interaction model on top
  of them would conflict rather than help. It carries the same caption track, so the browser's own
  captions menu is what shows it; <code>captionsVisible</code> follows that menu.
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

<p class="demo-note">
  <code>captionsButton</code> (fourth player): the custom overlay has no browser captions menu, so a
  supplied track would otherwise have no way to be shown. The button is a real toggle named
  <em>Captions</em> with <code>aria-pressed</code>; press Play, then the button (Tab, then Enter or
  Space, or click) to show and hide the English cues. <code>captionsVisible</code> is bindable, so
  the button above the notes drives the same state from the host, and the readout beneath the grid
  reports it. With native <code>controls</code> the browser's own captions menu does this job and
  the toggle is not drawn. Two layout choices keep the cues readable, and the docs explain both: the
  player fits the <code>&lt;video&gt;</code> box to its width (<code
    >--media-player-media-width: 100%</code
  >) so no caption line is clipped, and the demo's WebVTT file sets <code>line:-4</code> on each cue so
  the text sits above the control row.
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

  /* Captions and the browser's own controls are laid out inside the <video> element's box. By
     default that box is as wide as the media at the player's height (a 16:9 clip in a 400px
     tall player is 711px), so inside a 320px player the overflow is clipped along with the
     picture -- and the middle of every caption line with it. Fitting the box to the player
     keeps captions whole. */
  .media-stage :global(.media-player),
  .demo-row :global(.media-player) {
    --media-player-media-width: 100%;
    /* Letterboxing exposes the player's own background. A 16:9 clip in a tall player leaves
       bars above and below, and the overlay's white controls need something dark behind
       them: against the page's light background the captions toggle was close to invisible. */
    --media-player-background: #000000;
  }
</style>
