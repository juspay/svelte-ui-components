<svelte:options
  customElement={{
    tag: 'sui-badge',
    shadow: 'open',
    props: {
      image: { type: 'String', reflect: true },
      alt: { type: 'String', reflect: true },
      value: { type: 'String', reflect: true },
      mode: { type: 'String', reflect: true },
      badgeHidden: { type: 'Boolean', reflect: true, attribute: 'hidden' },
      badgeAriaLabel: { type: 'String', reflect: true, attribute: 'arialabel' },
      testId: { type: 'String', reflect: true },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import Badge from '$lib/Badge/Badge.svelte';
  let props = $props();
</script>

<Badge {...props} hidden={props.badgeHidden} ariaLabel={props.badgeAriaLabel} />
