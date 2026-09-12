<script lang="ts">
  import Checkbox from '$lib/Checkbox/Checkbox.svelte';

  let checkboxChecked = $state(false);
  let checkboxIndeterminate = $state(true);

  // Controlled mode: the parent is the only writer. One parent adopts every
  // click; the other declines them all and only counts them.
  let adoptedChecked = $state(false);
  let declinedClicks = $state(0);

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
<p class="demo-caption">
  <code>name</code> opts the box into the form it sits in. An unchecked, indeterminate or disabled
  box submits nothing, and <code>required</code> moves invalid focus to the visible box rather than the
  control behind it.
</p>
<form class="demo-row" onsubmit={capture} data-pw="checkbox-form-demo">
  <Checkbox
    text="Accept terms"
    name="terms"
    value="accepted"
    required
    testId="checkbox-form-terms"
  />
  <Checkbox text="Send me updates" name="updates" testId="checkbox-form-updates" />
  <button type="submit" data-pw="checkbox-form-submit">Submit</button>
  <span data-pw="checkbox-form-result">{submitted}</span>
</form>
