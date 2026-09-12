<script lang="ts">
  import Radio from './Radio.svelte';

  let selectedValue = $state('');
</script>

<Radio name="payment" value="card" text="Card" required bind:selectedValue />
<Radio name="payment" value="upi" text="UPI" required bind:selectedValue />
