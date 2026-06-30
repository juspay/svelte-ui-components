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

  // String array shorthand (PR #232: items now accepts string[] directly)
  const statusOptions: string[] = ['Active', 'Inactive', 'Pending', 'Archived'];

  let singleValue: string[] = $state([]);
  let singleTickValue: string[] = $state([]);
  let searchValue: string[] = $state([]);
  let multiValue: string[] = $state([]);
  let multiSearchValue: string[] = $state([]);
  let selectAllValue: string[] = $state([]);
  let selectAllSearchValue: string[] = $state([]);
  let stringItemsValue: string[] = $state([]);
  let bottomContentValue: string[] = $state([]);
  let customIndicatorValue: string[] = $state([]);
  let alignValue: string[] = $state([]);
  let summaryValue: string[] = $state([]);
  let ghostValue: string[] = $state([]);
  let openEventLog: string[] = $state([]);
  let leftIconValue: string[] = $state([]);

  // Inline SVG data URI — a simple globe icon, no external asset needed
  const globeIconSrc =
    `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23555' stroke-width='1.5'%3E` +
    `%3Ccircle cx='8' cy='8' r='6.5'/%3E` +
    `%3Cellipse cx='8' cy='8' rx='3' ry='6.5'/%3E` +
    `%3Cline x1='1.5' y1='8' x2='14.5' y2='8'/%3E` +
    `%3C/svg%3E`;
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

<h3>Single select with selected tick</h3>
<div class="demo-row" style="max-width: 300px;">
  <Select items={fruits} bind:value={singleTickValue} placeholder="Choose a fruit" showSelectedTick />
  {#if singleTickValue.length > 0}
    <p class="demo-info">Selected ID: {singleTickValue.at(0)}</p>
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
  <Select
    items={fruits}
    multiple
    bind:value={multiValue}
    placeholder="Pick fruits"
    testId="select-multi-demo"
  />
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

<h3>Multi select + select all</h3>
<p>
  Pass <code>showSelectAll</code> in <code>multiple</code> mode to render a "Select all" row at the top
  of the dropdown. It toggles every listed option and shows an indeterminate (dash) indicator when only
  some are selected.
</p>
<div class="demo-row" style="max-width: 400px;">
  <Select
    items={fruits}
    multiple
    showSelectAll
    bind:value={selectAllValue}
    placeholder="Pick fruits"
    testId="select-all-demo"
  />
  {#if selectAllValue.length > 0}
    <p class="demo-info">Selected IDs: {selectAllValue.join(', ')}</p>
  {/if}
</div>

<h3>Multi select + select all + searchable</h3>
<p>
  With <code>searchable</code>, "Select all" toggles only the currently-filtered options, and a
  custom
  <code>selectAllLabel</code> can be supplied.
</p>
<div class="demo-row" style="max-width: 400px;">
  <Select
    items={languages}
    multiple
    showSelectAll
    searchable
    selectAllLabel="Select all (visible)"
    bind:value={selectAllSearchValue}
    placeholder="Search languages..."
    testId="select-all-search-demo"
  />
  {#if selectAllSearchValue.length > 0}
    <p class="demo-info">Selected IDs: {selectAllSearchValue.join(', ')}</p>
  {/if}
</div>

<h3>Disabled</h3>
<div class="demo-row" style="max-width: 300px;">
  <Select items={fruits} disabled placeholder="Can't touch this" />
</div>

<h3>String array shorthand</h3>
<p>
  Pass a plain <code>string[]</code> — each string becomes both the <code>id</code> and
  <code>label</code>.
</p>
<div class="demo-row" style="max-width: 300px;">
  <Select items={statusOptions} bind:value={stringItemsValue} placeholder="Select status" />
  {#if stringItemsValue.length > 0}
    <p class="demo-info">Selected: {stringItemsValue.at(0)}</p>
  {/if}
</div>

<h3>bottomContent snippet</h3>
<p>
  Render arbitrary content pinned to the bottom of the dropdown (e.g. a "Manage…" link or a bulk
  action).
</p>
<div class="demo-row" style="max-width: 300px;">
  <Select items={fruits} bind:value={bottomContentValue} placeholder="Choose a fruit">
    {#snippet bottomContent()}
      <button class="manage-link" onclick={() => console.log('Manage options clicked')}>
        + Manage options
      </button>
    {/snippet}
  </Select>
  {#if bottomContentValue.length > 0}
    <p class="demo-info">Selected: {bottomContentValue.at(0)}</p>
  {/if}
</div>

<h3>optionIndicator snippet (multi-select)</h3>
<p>Replace the default checkbox indicator with a custom one rendered per option.</p>
<div class="demo-row" style="max-width: 400px;">
  <Select items={languages} multiple bind:value={customIndicatorValue} placeholder="Pick languages">
    {#snippet optionIndicator({ checked })}
      <span class="custom-indicator" class:checked>{checked ? '✔' : '○'}</span>
    {/snippet}
  </Select>
  {#if customIndicatorValue.length > 0}
    <p class="demo-info">Selected: {customIndicatorValue.join(', ')}</p>
  {/if}
</div>

<h3>triggerSummary snippet (compact multi-select trigger)</h3>
<p>
  Pass a <code>triggerSummary</code> snippet to replace the per-value Pill loop with a compact summary
  label — useful for fixed-width filter triggers where pills would overflow.
</p>
<div class="demo-row" style="max-width: 220px;">
  <Select items={fruits} multiple bind:value={summaryValue} placeholder="Filter fruits">
    {#snippet triggerSummary({ value: selected, items: allItems })}
      <span class="trigger-summary">
        {selected.length === 0
          ? 'All'
          : selected.length === allItems.length
            ? 'All'
            : `${selected.length} selected`}
      </span>
    {/snippet}
  </Select>
  {#if summaryValue.length > 0}
    <p class="demo-info">Selected IDs: {summaryValue.join(', ')}</p>
  {/if}
</div>

<h3>Ghost hierarchy</h3>
<p>
  Use <code>hierarchy="ghost"</code> for a transparent, borderless trigger — ideal for toolbar or header
  selects where a full bordered input would be visually heavy.
</p>
<div class="demo-row" style="max-width: 300px;">
  <Select items={fruits} bind:value={ghostValue} placeholder="Ghost trigger" hierarchy="ghost" />
  {#if ghostValue.length > 0}
    <p class="demo-info">Selected: {ghostValue.at(0)}</p>
  {/if}
</div>

<h3>onopen / onclose callbacks</h3>
<p>
  Use <code>onopen</code> and <code>onclose</code> to react to dropdown open/close events.
</p>
<div class="demo-row" style="max-width: 300px;">
  <Select
    items={fruits}
    placeholder="Watch the log"
    onopen={() => (openEventLog = [...openEventLog, 'opened'])}
    onclose={() => (openEventLog = [...openEventLog, 'closed'])}
  />
  {#if openEventLog.length > 0}
    <p class="demo-info">Event log: {openEventLog.slice(-4).join(' → ')}</p>
  {/if}
</div>

<h3>Right-aligned dropdown</h3>
<p>
  Anchor the dropdown panel to the trigger's right edge (so a content-wider panel hangs leftward
  instead of overflowing).
</p>
<div class="demo-row" style="max-width: 200px; margin-left: 220px;">
  <Select
    items={cities}
    bind:value={alignValue}
    placeholder="Right aligned"
    dropdownAlign="right"
  />
</div>

<h3>leftIcon prop</h3>
<p>
  Pass an image URL (or data URI) via <code>leftIcon</code> to render a leading icon at the left of
  the trigger. Size is controlled by the <code>--select-left-icon-size</code> CSS variable (default 16px).
</p>
<div class="demo-row" style="max-width: 300px;">
  <Select
    items={cities}
    bind:value={leftIconValue}
    placeholder="Select a city"
    leftIcon={globeIconSrc}
    leftIconTestId="select-left-icon"
  />
  {#if leftIconValue.length > 0}
    <p class="demo-info">Selected: {leftIconValue.at(0)}</p>
  {/if}
</div>

<style>
  .demo-info {
    margin: 8px 0 0;
    font-size: 13px;
    color: #666;
  }

  .manage-link {
    display: block;
    width: 100%;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: var(--doc-accent, #4f46e5);
    text-align: left;
  }

  .custom-indicator {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    color: #aaa;
  }

  .custom-indicator.checked {
    color: #2563eb;
  }

  .trigger-summary {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
