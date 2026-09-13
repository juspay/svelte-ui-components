<script lang="ts">
  import InputButton from '$lib/InputButton/InputButton.svelte';

  let inputButtonValue = $state('');
  let messagesValue = $state('');
  let describedValue = $state('');
  let infoOnlyValue = $state('');
  let plainValue = $state('');

  let requiredValue = $state('');
  let submitted = $state('');

  function capture(event: SubmitEvent): void {
    event.preventDefault();
    const target = event.target;
    if (!(target instanceof HTMLFormElement)) {
      return;
    }
    submitted = [...new FormData(target)]
      .map(([key, value]) => `${key}=${String(value)}`)
      .join(' ');
  }
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

<h3>Required blocks submission</h3>
<p>
  <code>required</code> (previously only <code>mandatory</code>) now reaches the <code>Input</code>
  underneath, not just the decorative asterisk beside the label — before this PR it drew the asterisk
  and nothing else, so an empty "required" field submitted anyway. Leaving this one empty blocks the form
  with the browser's own validation message, exactly like a plain
  <code>&lt;input required&gt;</code>.
</p>
<form
  class="demo-row"
  onsubmit={capture}
  data-pw="input-button-required-form"
  style="max-width: 500px;"
>
  <InputButton
    bind:value={requiredValue}
    required
    inputProperties={{ label: 'Promo code', name: 'promo', placeholder: 'Required to submit' }}
    testId="input-button-required"
  />
  <button type="submit" data-pw="input-button-required-submit">Submit</button>
  <span data-pw="input-button-required-result">{submitted}</span>
</form>

<h2>Validity messaging</h2>
<p>
  InputButton renders the error and helper text itself. Both now carry ids and are referenced by <code
    >aria-describedby</code
  >
  on a group around the control, with <code>aria-invalid</code>
  set only while an error is showing.
</p>
<div
  class="demo-row"
  data-pw="inputbutton-field-contract"
  style="flex-direction: column; align-items: start;"
>
  <InputButton
    bind:value={describedValue}
    error="That address was rejected."
    inputProperties={{ label: 'Email', infoMessage: 'We only email about outages.' }}
    rightButtonProperties={{ text: 'Send' }}
    testId="inputbutton-described"
  />
  <InputButton
    bind:value={infoOnlyValue}
    inputProperties={{ label: 'Email', infoMessage: 'We only email about outages.' }}
    rightButtonProperties={{ text: 'Send' }}
    testId="inputbutton-info-only"
  />
  <InputButton
    bind:value={plainValue}
    inputProperties={{ label: 'Email' }}
    rightButtonProperties={{ text: 'Send' }}
    testId="inputbutton-undescribed"
  />
</div>
