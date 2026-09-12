<script lang="ts">
  import Toggle from './Toggle.svelte';

  let checked = $state(false);
</script>

<Toggle text="Notifications" bind:checked />
<span data-testid="state">{checked ? 'on' : 'off'}</span>
<button data-testid="force-on" onclick={() => (checked = true)}>Force on</button>
