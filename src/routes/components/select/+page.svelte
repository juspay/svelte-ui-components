<script lang="ts">
  import Select from '$lib/Select/Select.svelte';
  import type { SelectItem } from '$lib/Select/properties';

  const fruits: SelectItem[] = [
    { id: 'apple', label: 'Apple' },
    { id: 'banana', label: 'Banana' },
    { id: 'cherry', label: 'Cherry' },
    { id: 'date', label: 'Date' },
    { id: 'elderberry', label: 'Elderberry' },
    { id: 'fig', label: 'Fig' },
    { id: 'grape', label: 'Grape' }
  ];

  const languages: SelectItem[] = [
    { id: 'ts', label: 'TypeScript' },
    { id: 'js', label: 'JavaScript' },
    { id: 'py', label: 'Python' },
    { id: 'rs', label: 'Rust' },
    { id: 'go', label: 'Go' },
    { id: 'java', label: 'Java' },
    { id: 'swift', label: 'Swift' },
    { id: 'kotlin', label: 'Kotlin' }
  ];

  const cities: SelectItem[] = [
    { id: 'nyc', label: 'New York' },
    { id: 'ldn', label: 'London' },
    { id: 'tyo', label: 'Tokyo' },
    { id: 'par', label: 'Paris' },
    { id: 'syd', label: 'Sydney' },
    { id: 'ber', label: 'Berlin' },
    { id: 'tor', label: 'Toronto' },
    { id: 'mum', label: 'Mumbai' }
  ];

  const shippingZones: SelectItem[] = [
    { id: 'us', label: 'United States' },
    { id: 'ca', label: 'Canada' },
    { id: 'gb', label: 'United Kingdom' },
    { id: 'au', label: 'Australia' }
  ];

  let singleValue: string[] = $state([]);
  let searchValue: string[] = $state([]);
  let multiValue: string[] = $state([]);
  let multiSearchValue: string[] = $state([]);

  // bottomContent snippet demo
  let bottomContentValue: string[] = $state([]);
  let bottomContentLog: string[] = $state([]);

  // controlled open (accordion-style) demo
  let accordionOpen: boolean = $state(false);
  let controlledValue: string[] = $state([]);

  // hide Select All via CSS var demo
  let noSelectAllValue: string[] = $state([]);

  function onAddZone(): void {
    bottomContentLog = [
      ...bottomContentLog,
      `Add zone clicked at ${new Date().toLocaleTimeString()}`
    ];
  }
</script>

<div class="page-header">
  <span class="category-badge">Form Controls</span>
  <h1>Select</h1>
</div>

<h3>Single select</h3>
<div class="demo-row" style="max-width: 300px;">
  <Select items={fruits} bind:value={singleValue} placeholder="Choose a fruit" />
  {#if singleValue.length > 0}
    <p class="demo-info">Selected ID: {singleValue.at(0)}</p>
  {/if}
</div>

<h3>Single select + searchable</h3>
<div class="demo-row" style="max-width: 300px;">
  <Select items={cities} bind:value={searchValue} searchable placeholder="Search cities..." />
  {#if searchValue.length > 0}
    <p class="demo-info">Selected ID: {searchValue.at(0)}</p>
  {/if}
</div>

<h3>Multi select</h3>
<div class="demo-row" style="max-width: 400px;">
  <Select items={fruits} multiple bind:value={multiValue} placeholder="Pick fruits" />
  {#if multiValue.length > 0}
    <p class="demo-info">Selected IDs: {multiValue.join(', ')}</p>
  {/if}
</div>

<h3>Multi select + searchable</h3>
<div class="demo-row" style="max-width: 400px;">
  <Select
    items={languages}
    multiple
    searchable
    bind:value={multiSearchValue}
    placeholder="Search languages..."
  />
  {#if multiSearchValue.length > 0}
    <p class="demo-info">Selected IDs: {multiSearchValue.join(', ')}</p>
  {/if}
</div>

<h3>Disabled</h3>
<div class="demo-row" style="max-width: 300px;">
  <Select items={fruits} disabled placeholder="Can't touch this" />
</div>

<!-- ──────────────────────────────────────────────────────────────────────── -->
<!-- NEW FEATURES                                                             -->
<!-- ──────────────────────────────────────────────────────────────────────── -->

<h2 class="section-title">New features</h2>

<!-- Feature 1: bottomContent snippet -->
<h3>Feature 1 — bottomContent snippet</h3>
<p class="feature-desc">
  An optional footer snippet rendered inside the dropdown, below the options. Useful for action
  buttons like "Add zone" or "Manage rate names" (Lighthouse DataGrid footer / ShippingRuleForm).
</p>
<div class="demo-row" style="max-width: 400px;">
  <Select items={shippingZones} multiple bind:value={bottomContentValue} placeholder="Select zones">
    {#snippet bottomContent()}
      <button class="action-link" onclick={onAddZone}>+ Add shipping zone</button>
    {/snippet}
  </Select>
  {#if bottomContentValue.length > 0}
    <p class="demo-info">Selected: {bottomContentValue.join(', ')}</p>
  {/if}
  {#each bottomContentLog as entry (entry)}
    <p class="demo-info log-entry">{entry}</p>
  {/each}
</div>

<!-- Feature 2: controlled open prop -->
<h3>Feature 2 — controlled <code>open</code> prop (accordion-style)</h3>
<p class="feature-desc">
  The parent drives open/close via <code>bind:open</code>. Useful for accordion panels where a
  separate toggle controls visibility (Lighthouse TokenAdvance accordion).
</p>
<div class="demo-row" style="max-width: 400px;">
  <button class="toggle-btn" onclick={() => (accordionOpen = !accordionOpen)}>
    {accordionOpen ? 'Close' : 'Open'} select externally
  </button>
  <Select
    items={cities}
    bind:open={accordionOpen}
    bind:value={controlledValue}
    placeholder="Controlled by parent"
  />
  {#if controlledValue.length > 0}
    <p class="demo-info">Selected: {controlledValue.at(0)}</p>
  {/if}
</div>

<!-- Consumer recipe: hide Select All via CSS var -->
<h3>Consumer recipe — hide "Select All" via CSS variable</h3>
<p class="feature-desc">
  To hide the "Select All" row, set <code>--select-select-all-display: none</code> via the
  <code>classes</code> prop or a wrapper CSS rule. No library prop needed — the row's visibility is fully
  CSS-driven.
</p>
<div class="demo-side-by-side">
  <div>
    <p class="demo-label">Default (Select All visible)</p>
    <div style="max-width: 300px;">
      <Select items={languages} multiple placeholder="With Select All" />
    </div>
  </div>
  <div>
    <p class="demo-label">--select-select-all-display: none</p>
    <div style="max-width: 300px;">
      <Select
        items={languages}
        multiple
        bind:value={noSelectAllValue}
        placeholder="No Select All row"
        classes="hide-select-all"
      />
    </div>
  </div>
</div>

<style>
  .demo-info {
    margin: 8px 0 0;
    font-size: 13px;
    color: #666;
  }

  .section-title {
    margin-top: 48px;
    border-top: 1px solid #e5e7eb;
    padding-top: 24px;
  }

  .feature-desc {
    font-size: 13px;
    color: #555;
    margin: 4px 0 12px;
    max-width: 560px;
  }

  .demo-label {
    font-size: 12px;
    color: #888;
    margin: 0 0 6px;
  }

  .demo-side-by-side {
    display: flex;
    gap: 32px;
    align-items: flex-start;
  }

  .log-entry {
    font-family: monospace;
    color: #555;
  }

  .action-link {
    background: none;
    border: none;
    padding: 0;
    font-size: 13px;
    color: inherit;
    cursor: pointer;
    text-decoration: underline;
  }

  .toggle-btn {
    margin-bottom: 8px;
    padding: 6px 12px;
    font-size: 13px;
    border: 1px solid #cccccc;
    border-radius: 4px;
    background: #ffffff;
    cursor: pointer;
  }

  /* Consumer recipe: hide Select All row via CSS variable */
  :global(.hide-select-all) {
    --select-select-all-display: none;
  }
</style>
