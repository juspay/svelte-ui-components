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

  const paymentMethods: SelectItem[] = [
    { id: 'card', label: 'Credit / Debit Card' },
    { id: 'upi', label: 'UPI' },
    { id: 'nb', label: 'Net Banking' },
    { id: 'wallet', label: 'Wallet' },
    { id: 'emi', label: 'EMI' },
    { id: 'cod', label: 'Cash on Delivery' }
  ];

  let singleValue: string[] = $state([]);
  let searchValue: string[] = $state([]);
  let multiValue: string[] = $state([]);
  let multiSearchValue: string[] = $state([]);

  // (a) bottomContent — zone picker with an add action in the footer
  let zoneValue: string[] = $state([]);
  let addedZoneCount = $state(0);
  const handleAddZone = (): void => {
    addedZoneCount += 1;
  };

  // (b) controlled open — parent drives accordion-style toggle
  let accordionOpen = $state(false);
  let controlledValue: string[] = $state([]);

  // (c) allowSelectAll=false — suppress the Select All row
  let paymentValue: string[] = $state([]);

  // (d) deferred apply — onchange fires only on Apply
  let deferredValue: string[] = $state([]);
  let deferredLog: string[] = $state([]);
  const handleDeferredChange = (vals: string[]): void => {
    deferredLog = [...deferredLog, `Applied: [${vals.join(', ')}]`];
  };
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

<hr class="demo-divider" />

<h2>New capabilities</h2>

<h3>(a) bottomContent Snippet — custom footer inside the dropdown panel</h3>
<p class="demo-caption">
  Pass a <code>bottomContent</code> snippet to render pinned content below the item list. This unblocks
  ShippingRuleForm (Add Shipping Zone) and JSONForm (nested form) in Lighthouse.
</p>
<div class="demo-row" style="max-width: 360px;">
  <Select items={cities} bind:value={zoneValue} placeholder="Select shipping zone">
    {#snippet bottomContent()}
      <div class="demo-footer-action">
        <button type="button" class="demo-add-btn" onclick={handleAddZone}> + Add new zone </button>
        {#if addedZoneCount > 0}
          <span class="demo-badge">{addedZoneCount} added</span>
        {/if}
      </div>
    {/snippet}
  </Select>
  {#if zoneValue.length > 0}
    <p class="demo-info">Selected: {zoneValue.at(0)}</p>
  {/if}
</div>

<h3>(b) Controlled open state (manageOpenState={false} + bind:open)</h3>
<p class="demo-caption">
  When <code>manageOpenState=false</code> the parent drives open/close via the bindable
  <code>open</code> prop. This unblocks RtoSuite/TokenAdvance accordion in Lighthouse.
</p>
<div class="demo-row" style="max-width: 360px;">
  <div class="demo-accordion-header">
    <span>Choose a language</span>
    <button type="button" class="demo-toggle-btn" onclick={() => (accordionOpen = !accordionOpen)}>
      {accordionOpen ? 'Close panel' : 'Open panel'}
    </button>
  </div>
  <Select
    items={languages}
    bind:value={controlledValue}
    bind:open={accordionOpen}
    manageOpenState={false}
    placeholder="Panel driven by parent"
    onopen={() => (accordionOpen = true)}
    onclose={() => (accordionOpen = false)}
  />
  {#if controlledValue.length > 0}
    <p class="demo-info">Selected: {controlledValue.at(0)}</p>
  {/if}
</div>

<h3>(c) allowSelectAll={false} — suppress the Select All row</h3>
<p class="demo-caption">
  Set <code>allowSelectAll=false</code> to hide the "Select All / Deselect All" row in multi-select mode.
  This unblocks offers/PaymentMethodField in Lighthouse.
</p>
<div class="demo-row" style="max-width: 400px;">
  <Select
    items={paymentMethods}
    multiple
    allowSelectAll={false}
    bind:value={paymentValue}
    placeholder="Select payment methods"
  />
  {#if paymentValue.length > 0}
    <p class="demo-info">Selected: {paymentValue.join(', ')}</p>
  {/if}
</div>

<h3>(d) Deferred multi-select (showSelectButton=true) — Apply fires onchange</h3>
<p class="demo-caption">
  With <code>showSelectButton=true</code> the dropdown stays open as the user toggles items.
  <code>onchange</code> fires only when the Apply button is clicked. This unblocks offers/PaymentMethodField
  deferred-apply pattern in Lighthouse.
</p>
<div class="demo-row" style="max-width: 400px;">
  <Select
    items={paymentMethods}
    multiple
    allowSelectAll={false}
    showSelectButton={true}
    bind:value={deferredValue}
    placeholder="Pick methods and apply"
    onchange={handleDeferredChange}
    testId="deferred-select"
  />
  {#if deferredValue.length > 0}
    <p class="demo-info">Committed: {deferredValue.join(', ')}</p>
  {/if}
  {#if deferredLog.length > 0}
    <ul class="demo-log">
      {#each deferredLog as entry (entry)}
        <li>{entry}</li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .demo-info {
    margin: 8px 0 0;
    font-size: 13px;
    color: #666;
  }

  .demo-divider {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 32px 0;
  }

  .demo-caption {
    font-size: 13px;
    color: #555;
    margin: 0 0 12px;
    max-width: 520px;
  }

  .demo-footer-action {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
  }

  .demo-add-btn {
    background: none;
    border: 1px dashed #2563eb;
    color: #2563eb;
    border-radius: 4px;
    padding: 4px 10px;
    font-size: 13px;
    cursor: pointer;
  }

  .demo-add-btn:hover {
    background: #eff6ff;
  }

  .demo-badge {
    font-size: 12px;
    background: #dbeafe;
    color: #1d4ed8;
    border-radius: 999px;
    padding: 2px 8px;
  }

  .demo-accordion-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 14px;
  }

  .demo-toggle-btn {
    background: none;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    padding: 4px 10px;
    font-size: 12px;
    cursor: pointer;
  }

  .demo-toggle-btn:hover {
    background: #f9fafb;
  }

  .demo-log {
    margin: 8px 0 0;
    padding-left: 18px;
    font-size: 12px;
    color: #555;
    list-style: disc;
  }

  .demo-log li {
    margin-bottom: 2px;
  }
</style>
