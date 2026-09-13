<script lang="ts">
  import Checkbox from './Checkbox.svelte';

  let { checked = $bindable(true), indeterminate = $bindable(true), name = 'all' } = $props();
</script>

<Checkbox text="All" {name} required bind:checked bind:indeterminate />
