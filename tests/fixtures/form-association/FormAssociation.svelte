<script lang="ts">
  import { onMount } from 'svelte';
  import Checkbox from '$lib/Checkbox/Checkbox.svelte';
  import Toggle from '$lib/Toggle/Toggle.svelte';
  import Select from '$lib/Select/Select.svelte';

  let agree = $state(false);
  let subscribe = $state(true);
  let notifications = $state(false);
  let fruit = $state(['apple']);
  let colors = $state(['red', 'blue']);
  let entries = $state('');
  let changes = $state(0);

  onMount(() => {
    document.documentElement.dataset.fixtureReady = 'true';
  });
</script>

<h1>Form association</h1>
<form
  data-pw="fa-form"
  onchange={() => (changes += 1)}
  onsubmit={(event) => {
    event.preventDefault();
    entries = JSON.stringify(Array.from(new FormData(event.currentTarget).entries()));
  }}
>
  <Checkbox text="Agree" name="agree" bind:checked={agree} testId="fa-agree" />
  <Checkbox
    text="Subscribe"
    name="subscribe"
    value="yes"
    bind:checked={subscribe}
    testId="fa-subscribe"
  />
  <Checkbox text="Parent declines changes" controlled checked={false} testId="fa-declined" />
  <Toggle
    text="Notifications"
    name="notifications"
    bind:checked={notifications}
    testId="fa-notifications"
  />
  <Select
    items={[
      { id: 'apple', label: 'Apple' },
      { id: 'banana', label: 'Banana' }
    ]}
    name="fruit"
    bind:value={fruit}
    testId="fa-fruit"
  />
  <Select
    items={[
      { id: 'red', label: 'Red' },
      { id: 'green', label: 'Green' },
      { id: 'blue', label: 'Blue' }
    ]}
    name="colors"
    multiple
    bind:value={colors}
    testId="fa-colors"
  />
  <button type="submit" data-pw="fa-submit">Submit</button>
</form>
<pre data-pw="fa-result">{entries}</pre>
<output data-pw="fa-changes">{changes}</output>

<style>
  form {
    display: grid;
    gap: 16px;
    max-width: 320px;
  }
</style>
