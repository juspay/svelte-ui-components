<script lang="ts">
  import InputButton from '$lib/InputButton/InputButton.svelte';

  let inputButtonValue = $state('');
  let messagesValue = $state('');
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

<h3>External error + helper text</h3>
<p>
  The <code>error</code> prop renders an external error message independent of field validation;
  <code>infoMessage</code> renders alongside it. The two are colored differently — helper text is neutral,
  not the error red — so they cannot be mistaken for each other.
</p>
<div class="demo-row" style="max-width: 500px;">
  <InputButton
    bind:value={messagesValue}
    testId="input-button-messages-demo"
    error="This code has already been used"
    inputProperties={{
      placeholder: 'Enter promo code',
      infoMessage: 'Case-sensitive — check for extra spaces.'
    }}
    rightButtonProperties={{ text: 'Apply' }}
  />
</div>
