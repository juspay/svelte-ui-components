<script lang="ts">
  import InputButton from '$lib/InputButton/InputButton.svelte';

  let inputButtonValue = $state('');
</script>

<div class="page-header">
  <span class="category-badge">Form Controls</span>
  <h1>InputButton</h1>
</div>

<div class="demo-row" style="max-width: 500px;">
  <InputButton
    bind:value={inputButtonValue}
    inputProperties={{
      placeholder: 'Enter phone number',
      maxLength: 10
    }}
    rightButtonProperties={{ text: 'Submit' }}
  />
</div>
