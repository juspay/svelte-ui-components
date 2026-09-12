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
