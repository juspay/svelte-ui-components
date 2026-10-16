<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '$lib/Button/Button.svelte';
  import FileInput from '$lib/FileInput/FileInput.svelte';
  import Icon from '$lib/Icon/Icon.svelte';
  import MediaPlayer from '$lib/MediaPlayer/MediaPlayer.svelte';

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
</style>
