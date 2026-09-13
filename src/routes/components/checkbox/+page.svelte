<script lang="ts">
  import Checkbox from '$lib/Checkbox/Checkbox.svelte';

  let checkboxChecked = $state(false);
  let checkboxIndeterminate = $state(true);

  // Controlled mode: the parent is the only writer. One parent adopts every
  // click; the other declines them all and only counts them.
  let adoptedChecked = $state(false);
  let declinedClicks = $state(0);

  // `name` makes the control participate in native <form> submission, so a
  // consumer no longer mirrors it with a hidden input of their own.
  let formAgree = $state(false);
  let formSubscribe = $state(true);
  let checkboxEntries = $state('');

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
  <h1>Checkbox</h1>
</div>

<div class="demo-row">
  <Checkbox text="Default checkbox" bind:checked={checkboxChecked} testId="checkbox-default" />
  <Checkbox text="Disabled" disabled />
  <Checkbox text="Indeterminate" bind:indeterminate={checkboxIndeterminate} checked={false} />
  <Checkbox text="Checked disabled" checked disabled />
</div>

<h3>Controlled</h3>
<div class="demo-row">
  <Checkbox
    text="Parent adopts the click"
    controlled
    checked={adoptedChecked}
    onclick={(next: boolean) => {
      adoptedChecked = next;
    }}
    testId="checkbox-controlled-adopts"
  />
  <Checkbox
    text="Parent declines the click"
    controlled
    checked={false}
    onclick={() => {
      declinedClicks += 1;
    }}
    testId="checkbox-controlled-declines"
  />
  <span data-pw="checkbox-controlled-declines-count">{declinedClicks}</span>
</div>

<h3>Accessible name</h3>
<div class="demo-row">
  <Checkbox text="Named by its visible text" testId="checkbox-named-by-text" />
  <Checkbox
    text="Visible text always names it"
    ariaLabel="This explicit name is deliberately ignored"
    testId="checkbox-named-by-aria-label"
  />
  <Checkbox text="" ariaLabel="Named with no visible text" testId="checkbox-named-without-text" />
</div>

<h3>Attributes on the box</h3>
<div class="demo-row">
  <Checkbox
    text="The box carries an id and its own test attribute"
    attributes={{ id: 'checkbox-attributes-demo', 'data-pw': 'checkbox-attributes-custom' }}
    testId="checkbox-attributes"
  />
</div>

<h3>Native form submission</h3>
<p>
  With a <code>name</code>, a checkbox submits with the surrounding <code>&lt;form&gt;</code>
  exactly as a native one does: absent entirely when unchecked, and carrying <code>value</code> —
  defaulting to <code>on</code> — when checked.
</p>
<form
  class="demo-row"
  data-pw="checkbox-form"
  onsubmit={(event) => {
    event.preventDefault();
    checkboxEntries = JSON.stringify(Array.from(new FormData(event.currentTarget).entries()));
  }}
>
  <Checkbox
    text="Agree (no value, submits as 'on')"
    name="agree"
    bind:checked={formAgree}
    testId="checkbox-form-agree"
  />
  <Checkbox
    text="Subscribe (value='yes')"
    name="subscribe"
    value="yes"
    bind:checked={formSubscribe}
    testId="checkbox-form-subscribe"
  />
  <button type="submit" data-pw="checkbox-form-submit">Submit</button>
</form>
<pre data-pw="checkbox-form-result">{checkboxEntries}</pre>

<h3>Required boxes and where invalid focus lands</h3>
<p class="demo-caption">
  A second form, because a <code>required</code> box blocks submission entirely — it cannot share
  one with the demo above, whose point is that submit lands. An unchecked, indeterminate or disabled
  box submits nothing, and <code>required</code> moves invalid focus to the visible box rather than the
  control behind it.
</p>
<form class="demo-row" onsubmit={capture} data-pw="checkbox-required-form">
  <Checkbox
    text="Accept terms"
    name="terms"
    value="accepted"
    required
    testId="checkbox-required-terms"
  />
  <Checkbox text="Send me updates" name="updates" testId="checkbox-required-updates" />
  <button type="submit" data-pw="checkbox-required-submit">Submit</button>
  <span data-pw="checkbox-required-result">{submitted}</span>
</form>

<h2>Error and helper text are linked to the control</h2>
<p class="demo-caption">
  <code>errorMessage</code> and <code>infoMessage</code> are referenced by
  <code>aria-describedby</code> on the control the user actually reaches, and
  <code>aria-invalid</code> is set only while an error is showing.
</p>
<div class="demo-row" data-pw="field-contract" style="flex-direction: column; align-items: start;">
  <Checkbox
    text="Accept terms"
    errorMessage="You must accept the terms to continue."
    infoMessage="We only email about outages."
    testId="checkbox-described"
  />
  <Checkbox text="Send me updates" infoMessage="About one a month." testId="checkbox-info-only" />
  <Checkbox text="No messages at all" testId="checkbox-undescribed" />
</div>
