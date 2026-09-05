<script lang="ts">
  import { base } from '$app/paths';
  import ChatComposer from '$lib/ChatComposer/ChatComposer.svelte';

  let value = $state('');
  let sent: string[] = $state([]);

  // Real media, generated into static/demo-media: an actual JPEG photo and an
  // actual H.264 MP4. The chips carry real thumbnails, and clicking a tile opens
  // the full photo / plays the video in the lightbox below — the same open seams
  // (onopenrich*) a host app would wire to its own preview surface.
  const photo = {
    id: 'img-1',
    thumbnailData: `${base}/demo-media/sunset-beach-thumb.jpg`,
    filename: 'sunset-beach.jpg'
  };
  const clip = {
    id: 'vid-1',
    thumbnailData: `${base}/demo-media/promo-clip-poster.jpg`,
    filename: 'promo-clip.mp4'
  };

  let richValue = $state('');
  let richImages = $state([photo]);
  let richVideos = $state([clip]);
  let richFiles = $state([{ id: 'file-1', filename: 'q3-refund-report.csv' }]);

  type Preview = { kind: 'image'; title: string } | { kind: 'video'; title: string } | null;
  let preview = $state<Preview>(null);

  // Async onsubmit: a fake send that takes a moment to settle. `sendDisabled`
  // is bound to `asyncPending` so a second submit can't fire while the first
  // is still in flight — the pairing the docs recommend, since the composer
  // never infers that on its own. Toggling "Simulate failure" resolves to
  // `false`, which leaves the draft (and any attachments) exactly as they
  // were instead of clearing them. "Simulate rejection" throws instead of
  // resolving, exercising the other branch that keeps the draft — a rejected
  // promise, treated the same as a resolved `false` (see `submitResult.ts`).
  let asyncValue = $state('');
  let asyncPending = $state(false);
  let asyncFailNext = $state(false);
  let asyncRejectNext = $state(false);
  let asyncSent: string[] = $state([]);

  async function fakeSend(): Promise<boolean> {
    // Snapshot the toggles at call time — reading the reactive flags after
    // the delay would let a mid-flight toggle change the outcome of an
    // already dispatched send.
    const shouldFail = asyncFailNext;
    const shouldReject = asyncRejectNext;
    asyncPending = true;
    await new Promise((resolve) => setTimeout(resolve, 300));
    asyncPending = false;
    if (shouldReject) {
      throw new Error('simulated send failure');
    }
    return !shouldFail;
  }

  // Independent per-control disable: `textDisabled` and `voiceDisabled` each
  // gate one control on its own, with `disabled` left `false` throughout so
  // the composer never dims — only the two toggled controls actually stop
  // responding.
  let controlsValue = $state('');
  let controlsTextDisabled = $state(false);
  let controlsVoiceDisabled = $state(false);
  let voiceActivations = $state(0);
</script>

<div class="page-header">
  <span class="category-badge">Chat</span>
  <h1>ChatComposer</h1>
</div>

<div class="chat-theme composer-frame">
  <ChatComposer
    bind:value
    placeholder="Type a message…"
    onsubmit={(text) => {
      sent.push(text);
    }}
  />
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

<h2>Async submit — keeps the draft when the send fails</h2>
<label class="demo-toggle">
  <input type="checkbox" data-pw="async-submit-fail-toggle" bind:checked={asyncFailNext} />
  Simulate failure (onsubmit resolves to `false`)
</label>
<label class="demo-toggle">
  <input type="checkbox" data-pw="async-submit-reject-toggle" bind:checked={asyncRejectNext} />
  Simulate rejection (onsubmit's promise rejects)
</label>
<div class="chat-theme composer-frame">
  <ChatComposer
    bind:value={asyncValue}
    placeholder="Type a message…"
    sendDisabled={asyncPending}
    testId="async-submit-demo"
    inputTestId="async-submit-input"
    sendTestId="async-submit-send"
    onsubmit={async (text) => {
      const ok = await fakeSend();
      if (ok) {
        asyncSent.push(text);
      }
      return ok;
    }}
  />
</div>
{#each asyncSent as message, i (i)}
  <p class="demo-note" data-pw="async-submit-sent">{message}</p>
{/each}

<h2>Independent per-control disable — textDisabled / voiceDisabled / sendDisabled</h2>
<label class="demo-toggle">
  <input
    type="checkbox"
    data-pw="per-control-disable-text-toggle"
    bind:checked={controlsTextDisabled}
  />
  Disable textarea only
</label>
<label class="demo-toggle">
  <input
    type="checkbox"
    data-pw="per-control-disable-voice-toggle"
    bind:checked={controlsVoiceDisabled}
  />
  Disable voice button only
</label>
<div class="chat-theme composer-frame">
  <ChatComposer
    bind:value={controlsValue}
    placeholder="Type a message…"
    textDisabled={controlsTextDisabled}
    voiceDisabled={controlsVoiceDisabled}
    testId="per-control-disable-demo"
    inputTestId="per-control-disable-input"
    voiceTestId="per-control-disable-voice"
    sendTestId="per-control-disable-send"
    onvoice={() => {
      voiceActivations += 1;
    }}
    onsubmit={(text) => {
      sent.push(text);
    }}
  />
</div>
<p class="demo-note" data-pw="per-control-disable-voice-count">
  Voice activations: {voiceActivations}
</p>

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
        <img class="lightbox-media" src="{base}/demo-media/sunset-beach.jpg" alt={preview.title} />
      {:else}
        <!-- svelte-ignore a11y_media_has_caption -->
        <video class="lightbox-media" src="{base}/demo-media/promo-clip.mp4" controls autoplay loop
        ></video>
      {/if}
    </figure>
  </div>
{/if}

<style>
  .composer-frame {
    max-width: 480px;
  }

  .demo-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    color: var(--doc-text-primary, #18181b);
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
