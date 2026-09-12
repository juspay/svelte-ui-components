<svelte:options
  customElement={{
    tag: 'sui-checkbox',
    shadow: 'open',
    props: {
      text: { type: 'String', reflect: true },
      checked: { type: 'Boolean', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      indeterminate: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      checkedIcon: { type: 'Object' },
      indeterminateIcon: { type: 'Object' },
      classes: { type: 'String' },
      checkboxAriaLabel: { type: 'String', attribute: 'aria-label' },
      ariaControls: { type: 'String', attribute: 'aria-controls' },
      controlled: { type: 'Boolean', reflect: true },
      checkboxAttributes: { type: 'Object' },
      onclick: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Checkbox from '$lib/Checkbox/Checkbox.svelte';
  import type { CheckboxProperties } from '$lib/Checkbox/properties';
  // The element renames `ariaLabel` to `checkboxAriaLabel` because the platform already defines `ariaLabel` on every
  // HTMLElement, and `attributes` to `checkboxAttributes` for the same reason -- `Element.prototype.attributes` is the
  // live NamedNodeMap that Svelte's own generated `connectedCallback` iterates (`for (const attr of this.attributes)`).
  // Declaring a prop of that name replaced it with a plain object, so every `<sui-checkbox>` threw
  // `TypeError: this.attributes is not iterable` on connect and the component never initialised.
  // The rest still carries the component's own props -- saying so is what
  // a destructured `$props()` no longer infers on its own.
  let {
    checkboxAriaLabel,
    checkboxAttributes,
    ...props
  }: Omit<CheckboxProperties, 'ariaLabel' | 'attributes'> & {
    checkboxAriaLabel?: CheckboxProperties['ariaLabel'];
    checkboxAttributes?: CheckboxProperties['attributes'];
  } = $props();
</script>

<Checkbox {...props} ariaLabel={checkboxAriaLabel} attributes={checkboxAttributes}>
  {#snippet checkedIcon()}
    <slot name="checked-icon"></slot>
  {/snippet}
  {#snippet indeterminateIcon()}
    <slot name="indeterminate-icon"></slot>
  {/snippet}
</Checkbox>
