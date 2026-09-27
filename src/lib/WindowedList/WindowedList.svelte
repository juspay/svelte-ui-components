<script lang="ts" generics="T">
  import { tick } from 'svelte';
  import Button from '../Button/Button.svelte';
  import type { WindowedListProperties } from './properties';

  let {
    items,
    getKey,
    row,
    initialCount = 200,
    step = 200,
    earlier,
    earlierLabel = (next: number, hidden: number) => `Show ${next} earlier (${hidden} hidden)`,
    classes,
    testId
  }: WindowedListProperties<T> = $props();

  /* The window is anchored by KEY, not index. An index would slide with every
     append (the newest N), pushing rows out from under a reader who scrolled up;
     WebKit has no scroll anchoring to hide that jump. A key stays put while the
     list grows at the end. If the anchor's key disappears (the list was replaced
     or truncated), the window re-anchors to the newest `initialCount` -- whichever
     anchor it was, so a reveal that has since been truncated away cannot fall back
     to an older, stale one, and the new anchor then holds through later appends.

     `anchorKey` and `appliedReveal` are plain latches, not $state: they are
     written only inside the derived below, while it recomputes because `items` or
     `reveal` changed, and nothing else reads them. `reveal` is state: only the
     "show earlier" handler writes it, as a fresh object per click so a repeated
     key still reads as a new request. */
  let anchorKey: string | null = null;
  let appliedReveal: { key: string | null } | null = null;
  let reveal = $state.raw<{ key: string | null } | null>(null);

  function indexOfKey(key: string | null): number {
    return key === null ? -1 : items.findIndex((item) => getKey(item) === key);
  }

  function keyAt(index: number): string | null {
    return items.slice(index, index + 1).map(getKey)[0] ?? null;
  }

  const start = $derived.by(() => {
    if (reveal !== appliedReveal) {
      appliedReveal = reveal;
      anchorKey = reveal?.key ?? null;
    }
    const anchored = indexOfKey(anchorKey);
    if (anchored >= 0) {
      return anchored;
    }
    const fresh = Math.max(0, items.length - initialCount);
    anchorKey = keyAt(fresh);
    return fresh;
  });
  const shown = $derived(items.slice(start));
  const next = $derived(Math.min(step, start));

  let controlEl: HTMLElement | null = $state(null);

  function scrollParent(node: HTMLElement): HTMLElement | null {
    for (let el = node.parentElement; el !== null; el = el.parentElement) {
      if (/(auto|scroll|overlay)/.test(getComputedStyle(el).overflowY)) {
        return el;
      }
    }
    return document.scrollingElement instanceof HTMLElement ? document.scrollingElement : null;
  }

  /* Reveals `next` more above the window. The first row that was already
     rendered is measured before and after, and the scroller moves by the
     difference, so what the reader was looking at stays where it was. Browser
     scroll anchoring may already have done this (the difference is then ~0);
     WebKit has none, and there it is the whole fix. */
  async function showEarlier(): Promise<void> {
    if (start === 0) {
      return;
    }
    const firstRow = controlEl?.nextElementSibling ?? null;
    const before = firstRow instanceof HTMLElement ? firstRow.getBoundingClientRect().top : null;
    reveal = { key: keyAt(Math.max(0, start - step)) };
    await tick();
    if (firstRow instanceof HTMLElement && before !== null && firstRow.isConnected) {
      const scroller = scrollParent(firstRow);
      const delta = firstRow.getBoundingClientRect().top - before;
      if (scroller !== null && delta !== 0) {
        scroller.scrollTop += delta;
      }
    }
  }
</script>

<div
  class="windowed-list {classes ?? ''}"
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  {#if start > 0}
    <div class="windowed-list-earlier" bind:this={controlEl}>
      {#if typeof earlier === 'function'}
        {@render earlier({ hidden: start, next, showEarlier })}
      {:else}
        <Button text={earlierLabel(next, start)} onclick={() => void showEarlier()} />
      {/if}
    </div>
  {/if}
  {#each shown as item, i (getKey(item))}
    {@render row({ item, index: start + i, isFirst: i === 0 })}
  {/each}
</div>

<style>
  /* `contents` by default: the rows stay children of the consumer's own layout
     (a flex column's gap, a grid's tracks), exactly as if they were rendered
     without this wrapper. Set `--windowed-list-display` to give the list a box
     of its own. */
  .windowed-list {
    display: var(--windowed-list-display, contents);
  }

  .windowed-list-earlier {
    display: flex;
    justify-content: var(--windowed-list-earlier-justify, center);
    padding: var(--windowed-list-earlier-padding, 8px 0);
    /* The control must never be what the browser anchors on: it is about to
       have rows inserted directly under it. */
    overflow-anchor: none;
  }
</style>
