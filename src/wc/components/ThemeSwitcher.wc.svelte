<svelte:options
  customElement={{
    tag: 'sui-theme-switcher',
    shadow: 'open',
    props: {
      options: { type: 'Object' },
      value: { type: 'String', reflect: true },
      mode: { type: 'String', reflect: true },
      storageKey: { type: 'String', reflect: true },
      testId: { type: 'String' },
      classes: { type: 'String' },
      onchange: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import ThemeSwitcher from '$lib/ThemeSwitcher/ThemeSwitcher.svelte';
  let props = $props();
</script>

<ThemeSwitcher {...props} />
