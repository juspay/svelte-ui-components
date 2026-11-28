<script lang="ts">
  import ArmedButton from '#lib/ArmedButton/ArmedButton.svelte';

  let confirmations = $state(0);
</script>

<div class="page-header">
  <span class="category-badge">Buttons &amp; Actions</span>
  <h1>ArmedButton</h1>
  <p class="page-description">Confirm an action with a second press.</p>
</div>

<h2 class="demo-examples-heading">Confirm an action</h2>
<div class="demo-row">
  <ArmedButton
    label="Remove draft"
    confirmLabel="Confirm removal"
    onconfirm={() => {
      confirmations += 1;
    }}
  />
  <output>Confirmed removals: {confirmations}</output>
</div>
