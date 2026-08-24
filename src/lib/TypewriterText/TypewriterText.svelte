<script lang="ts">
  import { onMount, onDestroy, untrack } from 'svelte';
  import type { TypewriterTextProperties } from './properties';

  let {
    text,
    speed = 15,
    isStreaming = false,
    renderText,
    testId,
    classes
  }: TypewriterTextProperties = $props();

  let displayedText = $state('');
  let currentIndex = $state(0);
  let timeoutId = $state<ReturnType<typeof setTimeout> | null>(null);

  // Where typing left off, so newly streamed-in text continues rather than restarts.
  let previousTextLength = $state(0);

  const typeNextCharacter = (): void => {
    if (currentIndex < text.length) {
      displayedText = text.substring(0, currentIndex + 1);
      currentIndex++;
      timeoutId = setTimeout(typeNextCharacter, speed);
    }
  };

  // A reactive timer cannot be a $derived — same escape the chart components use.
  // Internal typing state is read untracked so the effect re-runs only when the
  // `text` prop itself changes, never on our own per-character writes.
  // eslint-disable-next-line no-restricted-syntax
  $effect(() => {
    const nextText = text;
    untrack(() => {
      // Streamed text CONTINUES what is already displayed. Anything else — a
      // shorter string, or one that no longer starts with what was typed — is a
      // replacement: stop the timer and retype from the start, instead of
      // leaving stale characters on screen.
      const isContinuation =
        nextText.length >= previousTextLength && nextText.startsWith(displayedText);
      if (!isContinuation) {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        displayedText = '';
        currentIndex = 0;
        previousTextLength = 0;
      }
      if (nextText.length > 0 && nextText.length > previousTextLength) {
        if (currentIndex >= previousTextLength) {
          if (timeoutId !== null) {
            clearTimeout(timeoutId);
          }
          typeNextCharacter();
        }
        previousTextLength = nextText.length;
      }
    });
  });

  // eslint-disable-next-line no-restricted-syntax
  $effect(() => {
    if (!isStreaming && text.length > 0) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      displayedText = text;
      currentIndex = text.length;
    }
  });

  onMount(() => {
    if (text.length > 0) {
      previousTextLength = text.length;
      typeNextCharacter();
    }
  });

  onDestroy(() => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  });
</script>

<div
  class="typewriter-text {classes ?? ''}"
  class:plain={typeof renderText !== 'function'}
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  {#if typeof renderText === 'function'}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html renderText(displayedText)}
  {:else}
    {displayedText}
  {/if}
</div>

<style>
  .typewriter-text {
    max-width: var(--typewriter-text-max-width, 100%);
  }

  .plain {
    white-space: var(--typewriter-text-white-space, pre-wrap);
  }
</style>
