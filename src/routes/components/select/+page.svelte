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

  let singleValue: string[] = $state([]);
  let searchValue: string[] = $state([]);
  let multiValue: string[] = $state([]);
  let multiSearchValue: string[] = $state([]);
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

<style>
  .demo-info {
    margin: 8px 0 0;
    font-size: 13px;
    color: #666;
  }
</style>
