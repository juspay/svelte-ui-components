<script lang="ts">
  import Label from '$lib/Label/Label.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Form Controls</span>
  <h1>Label</h1>
</div>

<h3 class="demo-heading">Explicit association</h3>
<p class="demo-caption">
  <code>for</code> links the label to the control's <code>id</code>. Clicking the text focuses the
  input, exactly as a native label does -- try it.
</p>
<div class="demo-row" style="flex-direction: column; align-items: flex-start; gap: 6px;">
  <Label for="demo-email" testId="label-explicit-demo">Email address</Label>
  <input id="demo-email" type="email" placeholder="you@example.com" />
</div>

<h3 class="demo-heading">Required field</h3>
<p class="demo-caption">
  The asterisk is visual only (<code>aria-hidden</code>); a visually-hidden "required" string is
  announced to assistive technology alongside it.
</p>
<div class="demo-row" style="flex-direction: column; align-items: flex-start; gap: 6px;">
  <Label for="demo-name" required testId="label-required-demo">Full name</Label>
  <input id="demo-name" required />
</div>

<h3 class="demo-heading">Implicit association</h3>
<p class="demo-caption">
  Omit <code>for</code> and wrap the control directly -- the native association still applies.
</p>
<div class="demo-row">
  <Label testId="label-implicit-demo">
    <input type="checkbox" />
    Subscribe to updates
  </Label>
</div>

<h3 class="demo-heading">Themed</h3>
<p class="demo-caption">
  Every visual value is a CSS custom property -- text color, weight and the required marker color
  can all be overridden.
</p>
<div class="demo-row" style="flex-direction: column; align-items: flex-start; gap: 6px;">
  <Label for="demo-themed" required classes="label-themed" testId="label-themed-demo">
    Card number
  </Label>
  <input id="demo-themed" />
</div>

<style>
  :global(.label-themed) {
    --label-color: #7c4dff;
    --label-font-weight: 700;
    --label-required-color: #ff6d00;
  }
</style>
