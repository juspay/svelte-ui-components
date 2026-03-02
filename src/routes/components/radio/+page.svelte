<script lang="ts">
  import Radio from '$lib/Radio/Radio.svelte';

  let selectedRadio = $state('upi');
</script>

<div class="page-header">
  <span class="category-badge">Form Controls</span>
  <h1>Radio</h1>
</div>

<div class="demo-row">
  <Radio name="payment" value="upi" bind:selectedValue={selectedRadio} text="UPI" />
  <Radio name="payment" value="card" bind:selectedValue={selectedRadio} text="Card" />
  <Radio name="payment" value="netbanking" bind:selectedValue={selectedRadio} text="Net Banking" />
</div>
<p class="state-display">Selected: {selectedRadio}</p>
