<script lang="ts">
  import Combobox from '$lib/Combobox/Combobox.svelte';
  import type { ComboboxItem } from '$lib/Combobox/properties';

  const fruits = [
    { id: 'apple', label: 'Apple' },
    { id: 'banana', label: 'Banana' },
    { id: 'cherry', label: 'Cherry' },
    { id: 'dragonfruit', label: 'Dragon Fruit' },
    { id: 'elderberry', label: 'Elderberry' },
    { id: 'fig', label: 'Fig' },
    { id: 'grape', label: 'Grape', disabled: true }
  ];

  let selected = $state('');
  let inputText = $state('');

  // multi-select
  let picked = $state<string[]>([]);

  // multi-select + create (tags). Keep a mutable item list so created tags persist.
  let tagItems = $state<ComboboxItem[]>([
    { id: 'frontend', label: 'frontend' },
    { id: 'backend', label: 'backend' },
    { id: 'design', label: 'design' }
  ]);
  let tags = $state<string[]>([]);

  // multi-select + limit
  let limited = $state<string[]>([]);

  // multi-select + custom action
  let withAction = $state<string[]>([]);
</script>

<div class="page-header">
  <span class="category-badge">Form Controls</span>
  <h1>Combobox</h1>
</div>

<h3>Single select</h3>
<div class="demo-row" style="max-width: 320px;">
  <Combobox
    items={fruits}
    bind:value={selected}
    bind:inputValue={inputText}
    placeholder="Search fruits..."
  />
  <p class="demo-info">Selected: {selected || 'none'} | Input: {inputText || 'empty'}</p>
</div>

<h3>Multi select (pills)</h3>
<p>
  Set <code>multiple</code> with a bindable <code>selected</code> array. Picks become removable pills.
</p>
<div class="demo-row" style="max-width: 420px;">
  <Combobox items={fruits} multiple bind:selected={picked} placeholder="Pick fruits…" />
  {#if picked.length > 0}
    <p class="demo-info">Selected: {picked.join(', ')}</p>
  {/if}
</div>

<h3>Multi select + create</h3>
<p>
  With <code>allowCreate</code>, typing a value with no match offers a "Create …" row. Use
  <code>oncreate</code> to persist it into your own list.
</p>
<div class="demo-row" style="max-width: 420px;">
  <Combobox
    items={tagItems}
    multiple
    allowCreate
    bind:selected={tags}
    placeholder="Add tags…"
    oncreate={(value) => {
      if (!tagItems.some((item) => item.id === value)) {
        tagItems = [...tagItems, { id: value, label: value }];
      }
    }}
  />
  {#if tags.length > 0}
    <p class="demo-info">Tags: {tags.join(', ')}</p>
  {/if}
</div>

<h3>Multi select + limit</h3>
<p>
  Cap selections with <code>maxSelected</code>; the dropdown shows a limit message once reached.
</p>
<div class="demo-row" style="max-width: 420px;">
  <Combobox
    items={fruits}
    multiple
    maxSelected={3}
    bind:selected={limited}
    placeholder="Pick up to 3…"
  />
  {#if limited.length > 0}
    <p class="demo-info">{limited.length}/3 selected</p>
  {/if}
</div>

<h3>Multi select + custom action</h3>
<p>Pass an <code>action</code> for a persistent row at the foot of the dropdown.</p>
<div class="demo-row" style="max-width: 420px;">
  <Combobox
    items={fruits}
    multiple
    bind:selected={withAction}
    placeholder="Pick fruits…"
    action={{ label: 'Manage fruits…', onClick: () => alert('Manage clicked') }}
  />
</div>

<style>
  .demo-info {
    font-size: 13px;
    color: #666;
    margin-top: 8px;
  }
</style>
