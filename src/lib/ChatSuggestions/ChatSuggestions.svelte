<script lang="ts">
  import Pill from '../Pill/Pill.svelte';
  import type { ChatSuggestion, ChatSuggestionsProperties } from './properties';

  let { items, disabled = false, onselect, testId, classes }: ChatSuggestionsProperties = $props();

  function labelOf(item: ChatSuggestion): string {
    return typeof item === 'string' ? item : item.label;
  }

  function valueOf(item: ChatSuggestion): string {
    if (typeof item === 'string') {
      return item;
    }
    return item.value ?? item.label;
  }
</script>

<div
  class="chat-suggestions {classes ?? ''}"
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  {#each items as item, index (index)}
    <div class="chip">
      <Pill text={labelOf(item)} {disabled} onclick={() => onselect?.(valueOf(item), index)} />
    </div>
  {/each}
</div>

<style>
  .chat-suggestions {
    box-sizing: border-box;
    display: flex;
    flex-wrap: var(--chat-suggestions-flex-wrap, wrap);
    align-items: center;
    gap: var(--chat-suggestions-gap, 8px);
    width: var(--chat-suggestions-width, 100%);
    padding: var(--chat-suggestions-padding, 0);
  }

  .chip {
    display: flex;
    --pill-cursor: pointer;
  }
</style>
