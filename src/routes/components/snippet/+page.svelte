<script lang="ts">
  import { onDestroy } from 'svelte';
  import SnippetComponent from '$lib/Snippet/Snippet.svelte';
  import Button from '$lib/Button/Button.svelte';
  import { createCopyState } from '$lib/Snippet/copyState.svelte';

  // The affordance without the presentation: a bare copy control beside a
  // truncating value, which is the shape Snippet cannot produce and which
  // consumers were hand-rolling instead.
  const host = 'ssh://runner-04.internal.example.com:2222';
  const hostCopy = createCopyState({ copyResetMs: 300 });
  onDestroy(hostCopy.destroy);
</script>

<div class="page-header">
  <span class="category-badge">Data Display</span>
  <h1>Snippet</h1>
</div>

<div class="demo-row" style="max-width: 500px; flex-direction: column; gap: 12px;">
  <SnippetComponent text="npm install @juspay/svelte-ui-components" prompt="$" showCopyButton />
  <SnippetComponent text="npx create-svelte@latest my-app" prompt=">" showCopyButton />
</div>

<h2>Copied-label / reset-duration options</h2>

<div class="demo-row" style="max-width: 500px; flex-direction: column; gap: 12px;">
  <!-- Regression guard: no copiedLabel/copyResetMs passed, so this stays on the
       unchanged default -- 'Copied!' text, 2000ms reset. -->
  <SnippetComponent testId="snippet-default" text="echo default" prompt="$" />
  <!-- copiedLabel/copyResetMs proof: a short reset so the test does not need to
       wait out the real 2000ms default. -->
  <SnippetComponent
    testId="snippet-copy-options"
    text="echo custom"
    prompt="$"
    copiedLabel="Link copied!"
    copyResetMs={300}
  />
</div>

<h2>The affordance without the box</h2>
<p class="demo-note">
  <code>createCopyState</code> is the same state machine <code>Snippet</code> runs on — clipboard write,
  copied flag, single-pending reset timer, teardown — with no presentation attached. A settings row that
  wants a copy control beside its own truncating value uses it directly, instead of hand-rolling a lookalike
  whose timer nobody has tested.
</p>
<div class="demo-row" data-pw="snippet-headless" style="align-items: center; gap: 8px;">
  <code class="host-value">{host}</code>
  <!-- No ariaLabel: it would override the visible text, so a screen-reader user
       would hear "Copy host" while the button reads "Copied!" (WCAG 2.5.3,
       Label in Name). The announcement is the caller's job here, because this
       demo deliberately renders no Snippet -- owning the presentation is the
       whole point of the extraction. -->
  <Button onclick={() => void hostCopy.copy(host)}>
    {hostCopy.copied ? 'Copied!' : 'Copy'}
  </Button>
  <!-- Outside the button and always present: a live region only announces when
       it is already in the DOM and its text changes. This is the shape the docs
       recommend and the one Snippet itself uses. -->
  <span class="visually-hidden" role="status" aria-live="polite"
    >{hostCopy.copied ? 'Copied to clipboard' : ''}</span
  >
</div>

<style>
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  .host-value {
    max-width: 260px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: monospace;
  }
</style>
