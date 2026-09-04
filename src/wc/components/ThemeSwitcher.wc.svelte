<svelte:options
  customElement={{
    tag: 'sui-theme-switcher',
    shadow: 'open',
    props: {
      options: { type: 'Object' },
      value: { type: 'String', reflect: true },
      mode: { type: 'String', reflect: true },
      storageKey: { type: 'String', reflect: true, attribute: 'storage-key' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onchange: { type: 'Object' },
      onChange: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import ThemeSwitcher from '$lib/ThemeSwitcher/ThemeSwitcher.svelte';
  let props = $props();
</script>

<ThemeSwitcher {...props} />
