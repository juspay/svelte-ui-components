<script lang="ts">
  import Radio from '$lib/Radio/Radio.svelte';
  import Choicebox from '$lib/Choicebox/Choicebox.svelte';
  import RatingGroup from '$lib/RatingGroup/RatingGroup.svelte';

  let payment = $state('');
  let accepted = $state(false);
  let confidence = $state(0);
  let submission = $state('');
</script>

<main>
  <h1>Composite form validity</h1>
  <input aria-label="Before validation" />
  <form
    onsubmit={(event) => {
      event.preventDefault();
      submission = JSON.stringify([...new FormData(event.currentTarget)]);
    }}
  >
    <Radio name="payment" value="cash" text="Cash payment" required bind:selectedValue={payment} />
    <Radio name="payment" value="card" text="Card payment" required bind:selectedValue={payment} />
    <Choicebox mode="checkbox" name="choice" value="accepted" required bind:selected={accepted}
      >Accept order</Choicebox
    >
    <RatingGroup name="confidence" ariaLabel="Order confidence" required bind:value={confidence} />
    <button type="submit">Submit order</button>
  </form>
  <output data-pw="submitted">{submission}</output>
</main>

<style>
  main {
    max-width: 640px;
    margin: 24px auto;
    display: grid;
    gap: 16px;
  }
  form {
    display: grid;
    gap: 12px;
  }
</style>
