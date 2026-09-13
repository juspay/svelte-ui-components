<svelte:options
  customElement={{
    tag: 'sui-label',
    shadow: 'open',
    props: {
      for: { type: 'String', reflect: true },
      required: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import Label from '$lib/Label/Label.svelte';
  import type { LabelProperties } from '$lib/Label/properties';

  // `for` can't be a destructured binding name -- it's a reserved word -- so
  // it's pulled in under `htmlFor` and re-emitted as the real `for` prop
  // below, exactly as Label.svelte itself does with the same prop.
  let { for: htmlFor, ...props }: LabelProperties = $props();
</script>

<Label {...props} for={htmlFor}>
  {#snippet children()}
    <slot></slot>
  {/snippet}
</Label>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (inline-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-label-display, inline-block);
  }
</style>
