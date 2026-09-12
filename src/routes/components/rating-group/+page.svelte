<script lang="ts">
  import RatingGroup from '$lib/RatingGroup/RatingGroup.svelte';

  let basicValue = $state(3);
  let halfValue = $state(2.5);
  let readonlyValue = $state(4);
  let customMaxValue = $state(6);
  let controlledValue = $state(0);

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
  <h1>RatingGroup</h1>
</div>

<div class="demo-row" style="flex-direction: column; align-items: flex-start; gap: 12px;">
  <RatingGroup bind:value={basicValue} ariaLabel="Rate this product" testId="rating-basic" />
  <span data-pw="rating-basic-value">Value: {basicValue}</span>
</div>

<h3>Half-star precision</h3>
<p class="demo-caption">
  <code>allowHalf</code> lets clicking the left half of a star land on the half value in between, and
  moves arrow keys in 0.5 steps instead of 1.
</p>
<div class="demo-row" style="flex-direction: column; align-items: flex-start; gap: 12px;">
  <RatingGroup
    bind:value={halfValue}
    allowHalf
    ariaLabel="Rate with half-star precision"
    testId="rating-half"
  />
  <span data-pw="rating-half-value">Value: {halfValue}</span>
</div>

<h3>Custom star count</h3>
<div class="demo-row">
  <RatingGroup
    bind:value={customMaxValue}
    max={10}
    ariaLabel="Rate out of ten"
    testId="rating-max-10"
  />
</div>

<h3>Readonly and disabled</h3>
<p class="demo-caption">
  <code>readonly</code> keeps the group focusable and its ARIA value live, but clicks and arrow keys
  no longer change it. <code>disabled</code> removes it from the tab order entirely.
</p>
<div class="demo-row">
  <RatingGroup
    value={readonlyValue}
    readonly
    ariaLabel="Average rating, read only"
    testId="rating-readonly"
  />
  <RatingGroup value={2} disabled ariaLabel="Disabled rating" testId="rating-disabled" />
</div>

<h3>Controlled via onchange</h3>
<div class="demo-row" style="flex-direction: column; align-items: flex-start; gap: 12px;">
  <RatingGroup
    value={controlledValue}
    onchange={(next) => (controlledValue = next)}
    ariaLabel="Controlled rating"
    testId="rating-controlled"
  />
  <span data-pw="rating-controlled-value">onchange reported: {controlledValue}</span>
</div>

<h3>Custom star icon</h3>
<p class="demo-caption">
  The <code>star</code> snippet renders each star from scratch, given its 0-based <code>index</code>
  and fill <code>state</code> (<code>'empty' | 'half' | 'full'</code>).
</p>
<div class="demo-row">
  <RatingGroup value={3} max={5} ariaLabel="Heart rating" testId="rating-custom-icon">
    {#snippet star({ state })}
      <span
        style="font-size: 22px; line-height: 1; color: {state === 'empty' ? '#d1d5db' : '#e0245e'};"
      >
        {state === 'empty' ? '♡' : '♥'}
      </span>
    {/snippet}
  </RatingGroup>
</div>

<h3>Native form submission</h3>
<p class="demo-caption">
  <code>name</code> submits the current rating. The unrated (<code>0</code>) state submits nothing,
  and
  <code>required</code> blocks submission until a real rating is made -- invalid focus lands on the group
  itself, since the hidden native input behind it is deliberately not a tab stop.
</p>
<form class="demo-row" onsubmit={capture} data-pw="rating-form-demo">
  <RatingGroup name="stars" required ariaLabel="Rate your experience" testId="rating-form-stars" />
  <button type="submit" data-pw="rating-form-submit">Submit</button>
  <span data-pw="rating-form-result">{submitted}</span>
</form>

<h3>Invalid range (renders no stars, not a broken row)</h3>
<div class="demo-row">
  <RatingGroup max={0} ariaLabel="Zero max" testId="rating-zero-max" />
  <RatingGroup value={Number.NaN} ariaLabel="NaN value" testId="rating-nan-value" />
</div>
