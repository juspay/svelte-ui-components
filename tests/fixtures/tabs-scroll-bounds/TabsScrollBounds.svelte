<script lang="ts">
  import { onMount } from 'svelte';
  import Tabs from '$lib/Tabs/Tabs.svelte';

  const query = new URLSearchParams(window.location.search);
  const direction = query.get('direction') === 'rtl' ? 'rtl' : 'ltr';
  const longItems = Array.from({ length: 12 }, (_, index) => `Audit tab ${index + 1}`);
  let items = $state(query.get('kind') === 'fit' ? ['Alpha', 'Beta', 'Gamma'] : longItems);
  let activeIndex = $state(0);
  const initialWidth = Number(query.get('width')) || (query.get('kind') === 'fit' ? 520 : 220);
  let width = $state(initialWidth);
  let height = $state(140);
  let hidden = $state(false);
  let fontSize = $state(14);
  let orientation = $state<'horizontal' | 'vertical'>(
    query.get('orientation') === 'vertical' ? 'vertical' : 'horizontal'
  );
  let fontWeight = $state(400);
  let paddingInline = $state(16);
  const constraint = query.get('constraint') ?? '';

  onMount(() => {
    document.documentElement.dataset.hydrated = 'true';
  });
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === 'r') {
      items = ['Alpha', 'Beta', 'Gamma'];
    }
    if (event.key === 'q') {
      items = ['A "B"', '東京', 'Été'];
    }
  }}
/>

<button data-pw="before-tabs">Before tabs</button>
<div
  data-pw="bounds-demo"
  style="direction: {direction}; width: {width}px; max-width: 100%; --tabs-item-font-size: {fontSize}px; --tabs-active-font-weight: {fontWeight}; --tabs-item-padding: 12px {paddingInline}px; --bounds-height: {height}px; display: {hidden
    ? 'none'
    : 'block'};"
>
  <Tabs
    {items}
    {activeIndex}
    {orientation}
    classes="bounds-tabs {constraint}"
    ariaLabel="Scroll bounds audit tabs"
    onchange={(index) => (activeIndex = index)}
  />
</div>
<button data-pw="expand-items" onclick={() => (items = longItems)}>Expand items</button>
<button data-pw="fit-items" onclick={() => (items = ['Alpha', 'Beta', 'Gamma'])}>Fit items</button>
<button data-pw="fit-short-items" onclick={() => (items = ['Alpha', 'Beta', 'Delta'])}
  >Fit short items</button
>
<button data-pw="narrow" onclick={() => (width = 160)}>Narrow container</button>
<button data-pw="wide" onclick={() => (width = 2400)}>Fit all items</button>
<button data-pw="large-type" onclick={() => (fontSize = 24)}>Large type</button>
<button data-pw="normal-type" onclick={() => (fontSize = 14)}>Normal type</button>
<button data-pw="heavy-weight" onclick={() => (fontWeight = 900)}>Heavy weight</button>
<button data-pw="normal-weight" onclick={() => (fontWeight = 400)}>Normal weight</button>
<button data-pw="wide-padding" onclick={() => (paddingInline = 28)}>Wide item padding</button>
<button data-pw="normal-padding" onclick={() => (paddingInline = 16)}>Normal item padding</button>
<button
  data-pw="zero-axis"
  onclick={() => {
    if (orientation === 'vertical') {
      height = 0;
    } else {
      width = 0;
    }
  }}>Zero axis</button
>
<button
  data-pw="restore-axis"
  onclick={() => {
    width = initialWidth;
    height = 140;
  }}>Restore axis</button
>
<button data-pw="hide-tabs" onclick={() => (hidden = true)}>Hide tabs</button>
<button data-pw="show-tabs" onclick={() => (hidden = false)}>Show tabs</button>
<button
  data-pw="fit-selected-items"
  onclick={() => {
    items = ['Alpha', 'Beta', 'Gamma'];
    activeIndex = 1;
  }}>Fit selected items</button
>
<button
  data-pw="toggle-orientation"
  onclick={() => (orientation = orientation === 'vertical' ? 'horizontal' : 'vertical')}
  >Toggle orientation</button
>
<output data-pw="selection">Selected: {activeIndex}</output>

<style>
  :global(body) {
    margin: 0;
    padding: 16px;
    font-family: Arial, sans-serif;
  }

  button {
    margin: 4px;
  }

  [data-pw='bounds-demo'] {
    margin: 12px 0;
  }

  :global(.bounds-tabs.vertical) {
    height: var(--bounds-height, 140px);
  }

  :global(.bounds-tabs.bar-max .tabs-bar) {
    max-width: 180px;
  }

  :global(.bounds-tabs.bar-fixed .tabs-bar) {
    flex: none;
    width: 180px;
  }

  :global(.bounds-tabs.bar-fixed-height .tabs-bar) {
    flex: none;
    height: 100px;
  }

  :global(.bounds-tabs.bar-percent .tabs-bar) {
    max-width: 80%;
  }

  :global(.bounds-tabs.bar-calc .tabs-bar) {
    max-width: calc(100% - 40px);
  }

  :global(.bounds-tabs.owner-padding) {
    padding-inline: 12px;
    column-gap: 6px;
    box-sizing: border-box;
  }
</style>
