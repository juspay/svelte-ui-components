<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { SnippetProperties } from './properties';
  import Button from '../Button/Button.svelte';
  import copySvg from '$lib/assets/copy.svg?raw';
  import { createCopyState } from './copyState.svelte';

  let {
    text,
    prompt = '$',
    showCopyButton = true,
    testId,
    copyIcon,
    copiedLabel = 'Copied!',
    copyResetMs = 2000,
    oncopy,
    onerror,
    classes
  }: SnippetProperties = $props();

  // The whole copy affordance -- clipboard write, `copied` flag, the reset
  // timer's single-pending guarantee from #530, and teardown -- lives in
  // `createCopyState` so a consumer who wants the behaviour without this
  // component's `<code>` box can have it (#574). Getters rather than plain
  // values, because the factory reads its options at copy time and these are
  // props: passing them by value would freeze whatever they were at mount.
  const copyState = createCopyState({
    get copyResetMs() {
      return copyResetMs;
    },
    get oncopy() {
      return oncopy;
    },
    get onerror() {
      return onerror;
    }
  });
  onDestroy(copyState.destroy);

  const handleCopy = (): void => {
    void copyState.copy(text);
  };
</script>

<div
  class="snippet {classes ?? ''}"
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  <code class="snippet-code">
    <span class="snippet-prompt">{prompt}</span>
    <span class="snippet-text">{text}</span>
  </code>
  {#if showCopyButton}
    <div class="snippet-copy">
      <!-- The label is only supplied while the button shows an icon and has no
           visible text of its own. Keeping it once the label swaps to
           "Copied!" would leave a screen reader announcing "Copy to clipboard"
           over the visible feedback (WCAG 2.5.3, Label in Name). -->
      <Button onclick={handleCopy} {...copyState.copied ? {} : { ariaLabel: 'Copy to clipboard' }}>
        {#if copyState.copied}
          <span class="snippet-copied">{copiedLabel}</span>
        {:else if typeof copyIcon === 'function'}
          {@render copyIcon()}
        {:else}
          <!-- eslint-disable svelte/no-at-html-tags -->
          <span class="snippet-copy-icon">{@html copySvg}</span>
        {/if}
      </Button>
    </div>
    <!-- A live region has to be in the DOM *before* its text changes, or many
         screen-reader/browser pairs never announce it. The visible label is
         swapped inside the button, so the announcement lives here instead:
         always rendered, outside the button, with only its text changing. -->
    <span class="snippet-status" role="status" aria-live="polite"
      >{copyState.copied ? copiedLabel : ''}</span
    >
  {/if}
</div>

<style>
  .snippet {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--snippet-gap, 8px);
    background: var(--snippet-background, #1e1e1e);
    border: var(--snippet-border, 1px solid #333);
    border-radius: var(--snippet-border-radius, var(--radius, 4px));
    padding: var(--snippet-padding, 12px 16px);
    font-family: var(--snippet-font-family, monospace);
    font-size: var(--snippet-font-size, 14px);
    color: var(--snippet-color, #e0e0e0);
    margin: var(--snippet-margin, 0);
  }

  .snippet-code {
    display: flex;
    align-items: center;
    overflow: hidden;
    flex: 1;
    min-width: 0;
  }

  .snippet-prompt {
    color: var(--snippet-prompt-color, #888);
    margin-right: var(--snippet-prompt-margin-right, 8px);
    flex-shrink: 0;
  }

  .snippet-text {
    color: var(--snippet-text-color, #e0e0e0);
    font-family: var(--snippet-text-font-family, inherit);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .snippet-copy {
    --button-color: var(--snippet-copy-background, transparent);
    --button-text-color: var(--snippet-copy-color, #888);
    --button-border: var(--snippet-copy-border, none);
    --button-padding: var(--snippet-copy-padding, 4px);
    --button-border-radius: var(--snippet-copy-border-radius, var(--radius, 4px));
    --cursor: var(--snippet-copy-cursor, pointer);
    --button-hover-color: var(--snippet-copy-hover-background, #333);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .snippet-copy-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--snippet-copy-size, 16px);
    height: var(--snippet-copy-size, 16px);
  }

  .snippet-copy-icon :global(svg) {
    width: 100%;
    height: 100%;
  }

  /* Announced, never shown: the visible "Copied!" is the label inside the
     button, and repeating it on screen would read as a duplicate. */
  .snippet-status {
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

  .snippet-copied {
    color: var(--snippet-copied-color, #4caf50);
    font-size: var(--snippet-copied-font-size, 12px);
    font-family: var(--snippet-font-family, monospace);
  }
</style>
