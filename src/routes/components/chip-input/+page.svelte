<script lang="ts">
  import ChipInput from '$lib/ChipInput/ChipInput.svelte';

  let productTags = $state(['sale', 'featured']);
  let blockedEmails = $state<string[]>([]);
  let themedTags = $state(['urgent']);
  let inheritedTags = $state(['inherited']);
</script>

<div class="page-header">
  <span class="category-badge">Form Controls</span>
  <h1>ChipInput</h1>
</div>

<div class="demo-row" style="max-width: 400px;">
  <h3>Product tags</h3>
  <ChipInput bind:values={productTags} placeholder="Add tag…" testId="chip-input-tags" />
  <p>Values: {productTags.join(', ') || '(empty)'}</p>
</div>

<div class="demo-row" style="max-width: 400px;">
  <h3>Blocklist entry (with onadd/ondismiss)</h3>
  <ChipInput
    bind:values={blockedEmails}
    placeholder="e.g. name@example.com"
    onadd={(value) => console.log('added', value)}
    ondismiss={(value) => console.log('removed', value)}
  />
</div>

<div class="demo-row" style="max-width: 400px;">
  <h3>Disabled</h3>
  <ChipInput values={['locked', 'read-only']} disabled />
</div>

<div class="demo-row" style="max-width: 400px;">
  <h3>Themed</h3>
  <ChipInput bind:values={themedTags} classes="chip-input-accent" testId="chip-input-accent" />
</div>

<div class="demo-row app-themed" style="max-width: 400px;">
  <h3>Inside an app that themes Pill globally</h3>
  <p>
    The surrounding app sets <code>--pill-background</code> / <code>--pill-color</code> the way a consumer's
    own theme would. The chips should follow that theme rather than the library's light-mode default.
  </p>
  <ChipInput bind:values={inheritedTags} testId="chip-input-inherited" />
</div>

<style>
  :global(.chip-input-accent) {
    --chip-input-pill-background: #d1ecf1;
    --chip-input-pill-color: #0c5460;
    --chip-input-draft-focus-border: 1px solid #3b82f6;
  }

  /* Mimics a consuming app that themes Pill app-wide (e.g. a dark surface). Before the token
     passthrough fix, ChipInput re-declared --pill-background on the pill element, so this
     inherited value was ignored and chips rendered with the library's light-mode hex.

     The size and shape tokens are here for the same reason: an app whose Pill is a larger,
     squarer chip was still getting the library's 13px / 999px pill, because re-declaring a token
     on the element beats inheriting it whatever the property. */
  .app-themed {
    --pill-background: #2f3542;
    --pill-color: #f1f2f6;
    --pill-font-size: 17px;
    --pill-padding: 3px 14px;
    --pill-border-radius: 5px;

    /* Deliberately hostile values for the draft field. These are the tokens ChipInput owns
       structurally to keep the field inline among the chips, so they must NOT be inherited —
       the spec asserts the component ignores them. */
    --input-padding: 20px 30px;
    --input-margin: 12px;
    --input-box-shadow: 0 0 0 3px red;
  }
</style>
