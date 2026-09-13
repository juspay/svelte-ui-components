<script lang="ts">
  import Radio from '$lib/Radio/Radio.svelte';

  let selectedRadio = $state('upi');

  let payment = $state('');

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
  <h1>Radio</h1>
</div>

<div class="demo-row">
  <Radio name="payment" value="upi" bind:selectedValue={selectedRadio} text="UPI" />
  <Radio name="payment" value="card" bind:selectedValue={selectedRadio} text="Card" />
  <Radio name="payment" value="netbanking" bind:selectedValue={selectedRadio} text="Net Banking" />
</div>
<p class="state-display">Selected: {selectedRadio}</p>

<h3>Native form submission</h3>
<p class="demo-caption">
  <code>required</code> on each member blocks submission until one is chosen, and only the selected value
  is submitted.
</p>
<form class="demo-row" onsubmit={capture} data-pw="radio-form-demo">
  <Radio
    name="checkout-method"
    value="wallet"
    text="Wallet"
    required
    bind:selectedValue={payment}
    testId="radio-form-wallet"
  />
  <Radio
    name="checkout-method"
    value="cod"
    text="Cash on delivery"
    required
    bind:selectedValue={payment}
    testId="radio-form-cod"
  />
  <button type="submit" data-pw="radio-form-submit">Submit</button>
  <span data-pw="radio-form-result">{submitted}</span>
</form>
