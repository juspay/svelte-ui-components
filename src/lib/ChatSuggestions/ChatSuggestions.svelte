<script lang="ts">
  import Pill from '../Pill/Pill.svelte';
  import Img from '../Img/Img.svelte';
  import Scroller from '../Scroller/Scroller.svelte';
  import type { ChatSuggestion, ChatSuggestionsProperties } from './properties';
  import { readDeprecatedProps, resolveDeprecatedProp } from '../deprecation';

  let {
    items,
    disabled = false,
    layout = 'wrap',
    direction = 'horizontal',
    maxVisible,
    loading = false,
    icon,
    chipClasses,
    onselect: onselectProp,
    onSelect,
    testId,
    classes
  }: ChatSuggestionsProperties = $props();

  // Every spelling this component still accepts resolves to one value; the lowercase one wins.
  const onselect = $derived(
    resolveDeprecatedProp('ChatSuggestions', 'onSelect', 'onselect', onSelect, onselectProp)
  );

  // Read once at mount so an old spelling is reported even if the event never fires.
  $effect.pre(() => {
    readDeprecatedProps(onselect);
  });

  const labelOf = (item: ChatSuggestion): string => (typeof item === 'string' ? item : item.label);

  const valueOf = (item: ChatSuggestion): string => {
    if (typeof item === 'string') {
      return item;
    }
    return item.value ?? item.label;
  };

  const iconOf = (item: ChatSuggestion): string | null =>
    typeof item === 'string' ? null : (item.icon ?? null);

  // The dispatched value is usually a longer phrasing of the label, so it doubles as
  // the hover text. Suppressed when they are the same, to avoid a tooltip that just
  // repeats the chip.
  const hintOf = (item: ChatSuggestion): string | null => {
    if (typeof item === 'string') {
      return null;
    }
    if (typeof item.hint === 'string') {
      return item.hint;
    }
    return typeof item.value === 'string' && item.value !== item.label ? item.value : null;
  };

  // Clamped so a negative limit means "show nothing", not slice-from-the-end.
  let shown = $derived(
    typeof maxVisible === 'number' ? items.slice(0, Math.max(0, maxVisible)) : items
  );
</script>

{#snippet chips()}
  {#each shown as item, index (index)}
    {@const resolvedIcon = iconOf(item)}
    <button
      type="button"
      class="chip {chipClasses ?? ''}"
      title={hintOf(item)}
      {disabled}
      onclick={() => onselect?.(valueOf(item), index)}
    >
      <Pill text={labelOf(item)} {disabled}>
        {#snippet leadingIcon()}
          {#if typeof icon === 'function'}
            {@render icon(resolvedIcon, index)}
          {:else if typeof resolvedIcon === 'string'}
            <Img src={resolvedIcon} alt="" fallback="" inlineSvg={true} />
          {/if}
        {/snippet}
      </Pill>
    </button>
  {/each}
{/snippet}

<div
  class="chat-suggestions {classes ?? ''}"
  class:vertical={direction === 'vertical'}
  class:loading
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  {#if !loading}
    {#if layout === 'scroll'}
      <Scroller
        {direction}
        showArrows={false}
        showGradient={false}
        hideScrollbar={true}
        dragToScroll={true}
        classes="chat-suggestions-scroller"
      >
        {@render chips()}
      </Scroller>
    {:else}
      {@render chips()}
    {/if}
  {/if}
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

  /* A vertical stack is a menu, not a chip row: each entry takes the full width so
     the labels align, which is what makes a long list scannable. */
  .chat-suggestions.vertical {
    flex-direction: column;
    align-items: var(--chat-suggestions-vertical-align-items, stretch);
  }

  .chat-suggestions.vertical .chip {
    width: var(--chat-suggestions-vertical-chip-width, 100%);
    --pill-width: 100%;
    --pill-justify-content: flex-start;
    --pill-text-align: left;
  }

  .chip {
    appearance: none;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    color: inherit;
    text-align: inherit;
    cursor: pointer;
    display: flex;
    /* A chip must never be wider than the row that holds it. Pills are content-sized
       and never wrap their label, so a long one spilled past the right edge —
       measured, four chips overflowed an 80px container.
       max-width alone is not enough: a flex item's min-width is auto, so it refuses
       to shrink below its content. min-width:0 lets it, and capping --pill-max-width
       hands the overflow to Pill's own ellipsis. */
    min-width: 0;
    max-width: 100%;
    --pill-max-width: 100%;
    --pill-flex-shrink: 1;
    --pill-cursor: pointer;
  }

  /* The Pill is itself a flex item, and its own min-width:auto is the last thing
     holding the label at full width. Zeroing it is what actually lets the ellipsis run. */
  .chip > :global(.pill) {
    min-width: 0;
  }
</style>
