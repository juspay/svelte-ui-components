<script lang="ts">
  import Combobox from '$lib/Combobox/Combobox.svelte';

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
</script>

<div class="page-header">
  <span class="category-badge">Form Controls</span>
  <h1>Combobox</h1>
</div>

<div class="demo-row" style="max-width: 320px;">
  <Combobox
    items={fruits}
    bind:value={selected}
    bind:inputValue={inputText}
    placeholder="Search fruits..."
  />
  <p style="font-size: 13px; color: #666; margin-top: 8px;">
    Selected: {selected || 'none'} | Input: {inputText || 'empty'}
  </p>
</div>
