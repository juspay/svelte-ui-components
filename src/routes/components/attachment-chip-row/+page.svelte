<script lang="ts">
  import '../_capability-demo-controls.css';
  import { base } from '$app/paths';
  import { AttachmentChipRow } from '$lib';
  import type { AttachmentChipImage, AttachmentChipFile, AttachmentChipVideo } from '$lib';

  const initialImages: AttachmentChipImage[] = [
    {
      id: 'landscape',
      filename: 'landscape.svg',
      thumbnailData: `${base}/demo-media/attachment-landscape.svg`
    }
  ];
  const initialFiles: AttachmentChipFile[] = Array.from({ length: 6 }, (_, i) => ({
    id: `notes-${i + 1}`,
    filename: `notes-${i + 1}.txt`
  }));
  const initialVideos: AttachmentChipVideo[] = [
    {
      id: 'promo',
      filename: 'promo-clip.mp4',
      thumbnailData: `${base}/demo-media/attachment-landscape.svg`
    }
  ];
  let images = $state([...initialImages]);
  let files = $state([...initialFiles]);
  let videos = $state([...initialVideos]);
  let opened = $state<{ kind: 'image' | 'file' | 'video'; name: string } | null>(null);
  let feedback = $state('Eight attachments ready');

  function releaseVideo(node: HTMLVideoElement): { destroy: () => void } {
    return {
      destroy: () => {
        node.pause();
        node.removeAttribute('src');
        node.load();
      }
    };
  }

  function reset(): void {
    images = [...initialImages];
    files = [...initialFiles];
    videos = [...initialVideos];
    opened = null;
    feedback = 'Eight attachments ready';
  }
</script>

<div class="page-header">
  <span class="category-badge">Chat</span>
  <h1>AttachmentChipRow</h1>
</div>

<h2 class="demo-examples-heading">Examples</h2>
<p>Open a local preview or remove an attachment. The strip scrolls within its column on a phone.</p>
<h3>Open and remove attachments</h3>
<div class="strip">
  <AttachmentChipRow
    {images}
    {files}
    {videos}
    testId="attachments-editable"
    ariaLabel="Editable attachment preview"
    imageTooltip={(image) => image.filename ?? 'Landscape image'}
    videoTooltip={(video) => video.filename ?? 'Promotional video'}
    onopenimage={(image) => (opened = { kind: 'image', name: image.filename ?? 'Landscape' })}
    onopenfile={(file) => (opened = { kind: 'file', name: file.filename })}
    onopenvideo={(video) => (opened = { kind: 'video', name: video.filename ?? 'Video' })}
    onremoveimage={(id) => {
      images = images.filter((image) => image.id !== id);
      feedback = 'Removed landscape.svg';
    }}
    onremovefile={(id) => {
      const file = files.find((entry) => entry.id === id);
      files = files.filter((entry) => entry.id !== id);
      feedback = `Removed ${file?.filename ?? 'file'}`;
    }}
    onremovevideo={(id) => {
      videos = videos.filter((video) => video.id !== id);
      feedback = 'Removed promo-clip.mp4';
    }}
  />
</div>
<button type="button" class="capability-demo-button" onclick={reset}>Reset attachments</button>
<p role="status" data-pw="attachment-feedback">{feedback}</p>
{#if opened}
  <section aria-label="Attachment preview" data-pw="attachment-preview">
    <h3>{opened.name}</h3>
    {#if opened.kind === 'image'}
      <img
        src="{base}/demo-media/attachment-landscape.svg"
        alt="Blue hills under a sun"
        width="240"
        height="120"
      />
    {:else if opened.kind === 'video'}
      <video
        use:releaseVideo
        controls
        preload="metadata"
        width="240"
        src="{base}/demo-media/promo-clip.mp4"
        ><track
          kind="captions"
          src="{base}/demo-media/promo-clip.vtt"
          srclang="en"
          label="English"
        /></video
      >
    {:else}
      <p>Local sample notes: review the attachment before sending.</p>
      <a href="{base}/demo-media/attachment-notes.txt" download={opened.name}
        >Download {opened.name}</a
      >
    {/if}
    <button type="button" class="capability-demo-button" onclick={() => (opened = null)}
      >Close preview</button
    >
  </section>
{/if}
<h3>Read-only attachments</h3>
<p>Without action callbacks, an overflowing strip is reached and scrolled with the keyboard.</p>
<div class="strip">
  <AttachmentChipRow
    files={initialFiles}
    testId="attachments-readonly"
    ariaLabel="Read-only files"
  />
</div>

<style>
  .strip {
    width: 100%;
    max-width: 420px;
    min-width: 0;
    margin-bottom: 16px;
  }
  section {
    padding: 16px;
    border: 1px solid var(--doc-border);
    border-radius: 8px;
    margin: 16px 0;
  }
  section img,
  section video {
    max-width: 100%;
  }
</style>
