<script lang="ts">
  import { onMount, onDestroy, untrack } from 'svelte';
  import { prefersReducedMotion } from '../utils';
  import type { TypewriterTextProperties, TypewriterCharacterDelayRange } from './properties';

  let {
    text,
    speed = 15,
    isStreaming = false,
    markdown = false,
    markdownOptions,
    renderText,
    variableDelay,
    resolveDelay,
    onprogress,
    renderCharacter,
    testId,
    classes
  }: TypewriterTextProperties = $props();

  // Keep the promise stable across streamed prop updates so the await block does
  // not flash escaped source between already-rendered Markdown frames.
  let rendererPromise: Promise<typeof import('../MarkdownText/markdown')> | null = null;
  function loadMarkdownRenderer(): Promise<typeof import('../MarkdownText/markdown')> {
    rendererPromise ??= import('../MarkdownText/markdown');
    return rendererPromise;
  }
  const markdownRenderer = $derived(markdown === true ? loadMarkdownRenderer() : null);
  // Object-valued custom-element props may receive JSON null or other non-objects.
  const safeMarkdownOptions = $derived(
    typeof markdownOptions === 'object' &&
      markdownOptions !== null &&
      !Array.isArray(markdownOptions)
      ? markdownOptions
      : {}
  );

  let displayedText = $state('');
  let currentIndex = $state(0);
  let timeoutId = $state<ReturnType<typeof setTimeout> | null>(null);

  // Where typing left off, so newly streamed-in text continues rather than restarts.
  let previousTextLength = $state(0);

  // Whitespace characters revealed so far — the state `resolveDelay` reads via
  // `TypewriterDelayContext.wordCount`. Reset alongside the other typing state
  // whenever `text` is replaced rather than continued (see the mount $effect below).
  let revealedWordCount = $state(0);

  const WHITESPACE_CHARACTERS = new Set([' ', '\n']);

  // The bulk-reveal path below discloses text without typing it, so the running whitespace
  // count has to be rebuilt from the text itself or a later continuation would resume from a
  // count that never saw the revealed suffix.
  const countWhitespace = (value: string): number => {
    let count = 0;
    for (const character of value) {
      if (WHITESPACE_CHARACTERS.has(character)) {
        count += 1;
      }
    }
    return count;
  };
  const PUNCTUATION_CHARACTERS = new Set([',', '.', '?', '!']);
  const DIGIT_PATTERN = /\d/;

  const randomDelayInRange = (range: TypewriterCharacterDelayRange): number => {
    return range.min + Math.random() * (range.max - range.min);
  };

  // Falls straight through to the flat `speed` — byte-identical to the pre-`variableDelay`
  // behaviour — for any consumer that never sets `variableDelay`/`resolveDelay`, or leaves
  // a class out of `variableDelay`. `resolveDelay`, when set, takes over entirely: it is
  // the more general mechanism (see its doc comment in properties.ts) and is expected to
  // own the full pacing decision rather than compose with `variableDelay`/`speed`.
  const resolveTypingDelay = (character: string, characterIndex: number): number => {
    if (typeof resolveDelay === 'function') {
      return resolveDelay({ character, index: characterIndex, wordCount: revealedWordCount });
    }
    if (!variableDelay) {
      return speed;
    }
    if (DIGIT_PATTERN.test(character) && variableDelay.digit) {
      return randomDelayInRange(variableDelay.digit);
    }
    if (WHITESPACE_CHARACTERS.has(character) && variableDelay.whitespace) {
      return randomDelayInRange(variableDelay.whitespace);
    }
    if (PUNCTUATION_CHARACTERS.has(character) && variableDelay.punctuation) {
      return randomDelayInRange(variableDelay.punctuation);
    }
    if (variableDelay.default) {
      return randomDelayInRange(variableDelay.default);
    }
    return speed;
  };

  // Disclose everything still pending at once. The whitespace count has to be rebuilt
  // from the text itself because the per-character path that normally maintains it is
  // skipped entirely, and a later continuation would otherwise resume from a count that
  // never saw the revealed suffix.
  const revealRemainingText = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    const hadRemainingText = currentIndex < text.length;
    displayedText = text;
    currentIndex = text.length;
    revealedWordCount = countWhitespace(text);
    if (hadRemainingText) {
      onprogress?.({ index: currentIndex, total: text.length, displayedText });
    }
  };

  const typeNextCharacter = (): void => {
    // Typing IS the animation here, so a reduced-motion request has to suppress the
    // reveal itself rather than a transition around it: disclose the text instead.
    // `ChatController` already bypasses its own drain loop on this setting, and the two
    // reveal implementations have to answer it identically — a consumer composing this
    // component through `Chat`'s `messageBody` snippet is running both at once.
    if (prefersReducedMotion()) {
      revealRemainingText();
      return;
    }
    if (currentIndex < text.length) {
      const revealedCharacter = text[currentIndex];
      const revealedCharacterIndex = currentIndex;
      // Word count is updated for THIS character before it is used to resolve THIS
      // character's own delay — the ordering `TypewriterDelayContext.wordCount` documents
      // and that a cyclical/positional `resolveDelay` depends on.
      if (WHITESPACE_CHARACTERS.has(revealedCharacter)) {
        revealedWordCount++;
      }
      displayedText = text.substring(0, currentIndex + 1);
      currentIndex++;
      onprogress?.({ index: currentIndex, total: text.length, displayedText });
      timeoutId = setTimeout(
        typeNextCharacter,
        resolveTypingDelay(revealedCharacter, revealedCharacterIndex)
      );
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
        revealedWordCount = 0;
      }
      if (nextText.length > 0 && nextText.length > previousTextLength) {
        if (currentIndex >= previousTextLength) {
          if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
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
      revealRemainingText();
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
  class:plain={markdown !== true && typeof renderText !== 'function'}
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  {#if markdown === true}
    {#await markdownRenderer}
      {displayedText}
    {:then renderer}
      {#if renderer !== null}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html renderer.renderMarkdown(displayedText, safeMarkdownOptions)}
      {:else}
        {displayedText}
      {/if}
    {:catch}
      {displayedText}
    {/await}
  {:else if typeof renderText === 'function'}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html renderText(displayedText)}
  {:else if renderCharacter}
    {#each displayedText.split('') as character, index (index)}
      {@render renderCharacter({ character, index })}
    {/each}
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
