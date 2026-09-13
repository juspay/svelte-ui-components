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
  let { badgeAriaLabel, badgeHidden, ...props } = $props();
</script>

<Badge {...props} hidden={badgeHidden} ariaLabel={badgeAriaLabel} />

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-badge-display, block);
  }
</style>
