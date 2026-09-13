<script lang="ts">
  import Choicebox from '$lib/Choicebox/Choicebox.svelte';

  let radioSelection = $state(0);
  let checkA = $state(false);
  let checkB = $state(false);

  function selectRadio(index: number): void {
    radioSelection = index;
  }

  let submitted = $state('');

  function handleSubmit(event: SubmitEvent): void {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement)) {
      return;
    }
    submitted = [...new FormData(form).entries()]
      .map(([key, value]) => `${key}=${String(value)}`)
      .join(' ');
  }
</script>

<div class="page-header">
  <span class="category-badge">Form Controls</span>
  <h1>Choicebox</h1>
</div>

<h3>Radio mode</h3>
<!-- Grouped and named, so assistive tech announces "1 of 3" rather than three
     unrelated radios. These cards carry no `name`, so they are deliberately NOT
     one of the groups Choicebox now forms by itself: the parent owns the
     selection through `radioSelection`, which is the controlled pattern. The
     self-grouping version — one tab stop, arrow-key roving, exclusive selection
     — is the `name="plan"` set under "Form participation" below. -->
<div class="demo-row" role="radiogroup" aria-label="Shipping speed">
  <Choicebox
    mode="radio"
    selected={radioSelection === 0}
    onclick={() => selectRadio(0)}
    testId="choicebox-radio-standard"
  >
    <span class="choice-title">Standard Shipping</span>
    <span class="choice-desc">3-5 business days</span>
  </Choicebox>
  <Choicebox
    mode="radio"
    selected={radioSelection === 1}
    onclick={() => selectRadio(1)}
    testId="choicebox-radio-express"
  >
    <span class="choice-title">Express Shipping</span>
    <span class="choice-desc">1-2 business days</span>
  </Choicebox>
  <Choicebox mode="radio" disabled testId="choicebox-radio-overnight">
    <span class="choice-title">Overnight</span>
    <span class="choice-desc">Next business day</span>
  </Choicebox>
</div>

<h3>Checkbox mode</h3>
<div class="demo-row">
  <Choicebox mode="checkbox" bind:selected={checkA} testId="choicebox-check-a">
    <span class="choice-title">Gift wrapping</span>
  </Choicebox>
  <Choicebox mode="checkbox" bind:selected={checkB} testId="choicebox-check-b">
    <span class="choice-title">Include receipt</span>
  </Choicebox>
</div>

<h3>Themed indicator</h3>
<p class="demo-note">
  <code>--choicebox-indicator-*</code> variables theme the radio dot / checkmark box independently of
  the card itself.
</p>
<div class="demo-row themed-indicator">
  <Choicebox mode="radio" selected testId="choicebox-themed-indicator">
    <span class="choice-title">Themed indicator</span>
  </Choicebox>
</div>

<h2>Validity messaging</h2>
<p>
  <code>errorMessage</code> and <code>infoMessage</code> are referenced by
  <code>aria-describedby</code> on the card itself, and <code>aria-invalid</code> is set only while an
  error is showing.
</p>
<div
  class="demo-row"
  data-pw="choicebox-field-contract"
  style="flex-direction: column; align-items: start;"
>
  <Choicebox
    mode="checkbox"
    errorMessage="Pick a plan to continue."
    infoMessage="You can change this later."
    testId="choicebox-described"
  >
    <span class="choice-title">Described</span>
  </Choicebox>
  <Choicebox mode="checkbox" infoMessage="You can change this later." testId="choicebox-info-only">
    <span class="choice-title">Helper only</span>
  </Choicebox>
  <Choicebox mode="checkbox" testId="choicebox-undescribed">
    <span class="choice-title">No messages</span>
  </Choicebox>
</div>

<h2 id="form-participation-demo">Form participation</h2>
<p>
  A <code>name</code> makes the card submit. In <code>radio</code> mode it also groups the cards that
  share it: one selection, one tab stop, and Arrow/Home/End move between them.
</p>
<form data-pw="choicebox-form" onsubmit={handleSubmit}>
  <div class="demo-row" style="flex-direction: column; align-items: start;">
    <Choicebox mode="radio" name="plan" value="basic" required testId="choicebox-form-basic">
      <span class="choice-title">Basic</span>
    </Choicebox>
    <Choicebox mode="radio" name="plan" value="pro" testId="choicebox-form-pro">
      <span class="choice-title">Pro</span>
    </Choicebox>
    <Choicebox mode="checkbox" name="addons" value="insurance" testId="choicebox-form-addon">
      <span class="choice-title">Add insurance</span>
    </Choicebox>
    <button type="submit" data-pw="choicebox-form-submit">Submit</button>
  </div>
</form>
<p data-pw="choicebox-form-result">{submitted}</p>

<style>
  .choice-title {
    font-weight: 600;
    font-size: 16px;
  }

  .choice-desc {
    font-size: 14px;
    opacity: 0.8;
  }

  .demo-note {
    font-size: 13px;
    color: var(--doc-text-muted, #6b7280);
  }

  .themed-indicator {
    --choicebox-indicator-selected-background: rgb(20, 130, 40);
    --choicebox-indicator-selected-border: 2px solid rgb(20, 130, 40);
    --choicebox-indicator-size: 28px;
  }
</style>
