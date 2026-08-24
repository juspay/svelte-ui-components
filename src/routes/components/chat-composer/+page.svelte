<script lang="ts">
  import ChatComposer from '$lib/ChatComposer/ChatComposer.svelte';

  let value = $state('');
  let sent: string[] = $state([]);

  // Real media, generated into static/demo-media: an actual JPEG photo and an
  // actual H.264 MP4. The chips carry real thumbnails, and clicking a tile opens
  // the full photo / plays the video in the lightbox below — the same open seams
  // (onopenrich*) a host app would wire to its own preview surface.
  const photo = {
    id: 'img-1',
    thumbnailData: '/demo-media/sunset-beach-thumb.jpg',
    filename: 'sunset-beach.jpg'
  };
  const clip = {
    id: 'vid-1',
    thumbnailData: '/demo-media/promo-clip-poster.jpg',
    filename: 'promo-clip.mp4'
  };

  let richValue = $state('');
  let richImages = $state([photo]);
  let richVideos = $state([clip]);
  let richFiles = $state([{ id: 'file-1', filename: 'q3-refund-report.csv' }]);

  type Preview = { kind: 'image'; title: string } | { kind: 'video'; title: string } | null;
  let preview = $state<Preview>(null);
</script>

<div class="page-header">
  <span class="category-badge">Chat</span>
  <h1>ChatComposer</h1>
</div>

<div class="chat-theme composer-frame">
  <ChatComposer bind:value placeholder="Type a message…" onsubmit={(text) => sent.push(text)} />
</div>

{#each sent as message, i (i)}
  <p class="demo-note">{message}</p>
{/each}

<h2>Rich attachment preview — built-in, via richImages / richVideos / richFiles</h2>
<div class="chat-theme composer-frame">
  <ChatComposer
    bind:value={richValue}
    placeholder="Add a note to your attachments…"
    {richImages}
    {richVideos}
    {richFiles}
    onremoverichimage={(id) => {
      richImages = richImages.filter((image) => image.id !== id);
    }}
    onremoverichvideo={(id) => {
      richVideos = richVideos.filter((video) => video.id !== id);
    }}
    onremoverichfile={(id) => {
      richFiles = richFiles.filter((file) => file.id !== id);
    }}
    richImageTooltip={(image) => image.filename ?? ''}
    richVideoTooltip={(video) => video.filename ?? ''}
    onopenrichimage={(image) => {
      preview = { kind: 'image', title: image.filename ?? 'Image' };
    }}
    onopenrichvideo={(video) => {
      preview = { kind: 'video', title: video.filename ?? 'Video' };
    }}
    onsubmit={(text) => {
      sent.push(
        `${text || '(attachments only)'} + ${richImages.length} images, ${richVideos.length} videos, ${richFiles.length} files`
      );
      richImages = [];
      richVideos = [];
      richFiles = [];
    }}
  />
</div>

{#if preview !== null}
  <div class="lightbox-backdrop" role="presentation" onclick={() => (preview = null)}>
    <figure class="lightbox" onclick={(event) => event.stopPropagation()} role="presentation">
      <figcaption class="lightbox-title">
        {preview.title}
        <button type="button" class="lightbox-close" onclick={() => (preview = null)}>
          Close
        </button>
      </figcaption>
      {#if preview.kind === 'image'}
        <img class="lightbox-media" src="/demo-media/sunset-beach.jpg" alt={preview.title} />
      {:else}
        <!-- svelte-ignore a11y_media_has_caption -->
        <video class="lightbox-media" src="/demo-media/promo-clip.mp4" controls autoplay loop
        ></video>
      {/if}
    </figure>
  </div>
{/if}

<style>
  .composer-frame {
    max-width: 480px;
  }

  .lightbox-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1200;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgb(0 0 0 / 65%);
  }

  .lightbox {
    margin: 0;
    padding: 12px;
    max-width: min(720px, calc(100vw - 48px));
    border: 1px solid var(--doc-border, #e5e7eb);
    border-radius: 12px;
    background: var(--doc-demo-bg, #fafafa);
  }

  .lightbox-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 8px;
    color: var(--doc-text-heading, #1a1a2e);
  }

  .lightbox-close {
    cursor: pointer;
    padding: 4px 12px;
    border: 1px solid var(--doc-btn-border, #d4d4d8);
    border-radius: 8px;
    background: var(--doc-btn-bg, #fafafa);
    color: var(--doc-text-primary, #18181b);
  }

  .lightbox-media {
    display: block;
    max-width: 100%;
    max-height: 70vh;
    border-radius: 8px;
  }
</style>
