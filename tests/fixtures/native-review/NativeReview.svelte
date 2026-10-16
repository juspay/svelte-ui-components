<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '$lib/Button/Button.svelte';
  import FileInput from '$lib/FileInput/FileInput.svelte';
  import Icon from '$lib/Icon/Icon.svelte';
  import MediaPlayer from '$lib/MediaPlayer/MediaPlayer.svelte';
  import Loader from '$lib/Loader/Loader.svelte';
  import Progress from '$lib/Progress/Progress.svelte';

  let selections = $state(0);
  let submitted = $state('');
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="12" height="24" fill="black"/></svg>';
  const emptySvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"></svg>';
  onMount(() => {
    document.documentElement.dataset.nativeReviewReady = 'true';
  });
</script>

<form
  data-pw="review-file-form"
  onsubmit={(event) => {
    event.preventDefault();
    const file = new FormData(event.currentTarget).get('attachment');
    submitted = file instanceof File ? `${file.name}:${file.size}` : 'missing';
  }}
>
  <label for="review-native-file">Attachment</label>
  <FileInput
    native
    testId="review-native-file"
    nativeAttrs={{ id: 'review-native-file', name: 'attachment', required: true }}
    accept="text/plain"
    onfiles={() => selections++}
  />
  <Button type="submit" text="Submit native file" />
</form>
<p data-pw="review-file-selections">{selections}</p>
<p data-pw="review-file-submission">{submitted}</p>

<div class="masks">
  <Icon mask size={24} icon={`data:image/svg+xml,${svg}`} testId="review-quoted-mask" />
  <Icon
    mask
    size={24}
    icon={`data:image/svg+xml,${encodeURIComponent(svg)}`}
    testId="review-encoded-mask"
  />
  <Icon
    mask
    size={24}
    icon={`data:image/svg+xml,${encodeURIComponent(emptySvg)}`}
    testId="review-empty-mask"
  />
  <span class="color-swatch" data-pw="review-mask-color"></span>
</div>

<Button
  text="Load native media metadata"
  onclick={() => {
    document.querySelectorAll<HTMLMediaElement>('audio,video').forEach((media) => media.load());
  }}
/>

{#each ['audio', 'native-video', 'styled-video'] as variant (variant)}
  <MediaPlayer
    type={variant === 'audio' ? 'audio' : 'video'}
    unstyled={variant === 'native-video'}
    src=""
    autoplay={false}
    controls
    testId={`review-${variant}`}
    nativeAttrs={{ preload: 'metadata' }}
  >
    <source
      src={variant === 'audio' ? '/review-audio.wav' : '/review-clip.mp4'}
      type={variant === 'audio' ? 'audio/wav' : 'video/mp4'}
    />
    <track kind="captions" src="/review-clip.vtt" srclang="en" label="Review captions" />
  </MediaPlayer>
{/each}

<div class="render-row">
  <div class="legacy-border" data-pw="legacy-border"></div>
  <Loader variant="border" classes="comparison-border" testId="shared-border" />
  <div class="legacy-orbit" data-pw="legacy-orbit"></div>
  <Loader variant="orbit" classes="comparison-orbit" testId="shared-orbit" />
</div>
<div class="render-row">
  <div class="legacy-progress" data-pw="legacy-progress">
    <div class="comparison-number left">02</div>
    <div class="legacy-segments">
      <div class="legacy-segment active"></div>
      <div class="legacy-segment active"></div>
      <div class="legacy-segment"></div>
      <div></div>
    </div>
    <div class="comparison-number right">03</div>
  </div>
  <Progress
    value={40}
    segments={3}
    ariaLabel="Tour progress"
    classes="comparison-progress"
    testId="shared-progress"
  >
    {#snippet leadingLabel()}<div class="comparison-number left">02</div>{/snippet}
    {#snippet trailingLabel()}<div class="comparison-number right">03</div>{/snippet}
  </Progress>
</div>

<style>
  .masks {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    color: rgb(31, 65, 91);
    background: white;
  }
  .color-swatch {
    width: 24px;
    height: 24px;
    background: currentColor;
  }
  .render-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 16px;
    margin-top: 24px;
  }
  .legacy-border {
    box-sizing: border-box;
    width: 50px;
    height: 50px;
    border: 4px solid #e0e0e0;
    border-top-color: #6c5ff9;
    border-bottom-color: #6c5ff9;
    border-right-color: #6c5ff9;
    border-radius: 50%;
    animation: legacy-spin 1s linear infinite;
  }
  :global(.comparison-border) {
    --loader-width: 50px;
    --loader-height: 50px;
    --loader-border-width: 4px;
    --loader-active-color: #6c5ff9;
    --loader-track-color: #e0e0e0;
    --loader-spin-duration: 1s;
  }
  .legacy-orbit {
    box-sizing: border-box;
    position: relative;
    width: 48px;
    height: 48px;
    animation: legacy-spin 1s linear infinite;
  }
  .legacy-orbit::before,
  .legacy-orbit::after {
    content: '';
    width: 24px;
    height: 24px;
    position: absolute;
    border-radius: 50%;
    background: #6c5ff9;
    animation: legacy-spin 1s linear infinite;
    transform-origin: 0 100%;
  }
  .legacy-orbit::before {
    transform-origin: 0 50%;
    background: #e0e0e0;
  }
  :global(.comparison-orbit) {
    --loader-orbit-primary: #6c5ff9;
    --loader-orbit-secondary: #e0e0e0;
  }
  @keyframes legacy-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  .legacy-progress {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    width: 350px;
  }
  .comparison-number {
    font:
      500 20px/1.5 Arial,
      sans-serif;
    min-width: 40px;
  }
  .comparison-number.left {
    text-align: right;
  }
  .comparison-number.right {
    text-align: left;
  }
  .legacy-segments {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 4px;
    position: relative;
    height: 8px;
  }
  .legacy-segment {
    flex: 1;
    height: 10px;
    background: #293038;
    border-radius: 2px;
  }
  .legacy-segment.active {
    background: #ffb300;
  }
  :global(.comparison-progress) {
    --progress-container-width: 350px;
    --progress-container-padding: 8px 0;
    --progress-container-gap: 12px;
    --progress-track-height: 8px;
    --progress-track-background: #293038;
    --progress-bar-background: #ffb300;
    --progress-segment-height: 10px;
    --progress-segment-gap: 4px;
    --progress-segment-padding: 0 4px 0 0;
    --progress-segment-border-radius: 2px;
  }
  @media (max-width: 768px) {
    .legacy-progress {
      width: 250px;
      gap: 8px;
    }
    .comparison-number {
      min-width: 32px;
    }
    .legacy-segment {
      height: 6px;
    }
    :global(.comparison-progress) {
      --progress-container-width: 250px;
      --progress-container-gap: 8px;
      --progress-segment-height: 6px;
    }
  }
</style>
