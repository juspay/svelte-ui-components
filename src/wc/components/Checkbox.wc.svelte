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
      boxAttributes: { type: 'Object' },
      name: { type: 'String', reflect: true },
      value: { type: 'String', reflect: true },
      required: { type: 'Boolean', reflect: true },
      form: { type: 'String', reflect: true },
      onclick: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Checkbox from '$lib/Checkbox/Checkbox.svelte';
  import type { CheckboxProperties } from '$lib/Checkbox/properties';
  import checkmarkSvg from '$lib/assets/checkmark.svg?raw';
  import minusSvg from '$lib/assets/minus.svg?raw';
  // The element renames `ariaLabel` to `checkboxAriaLabel` because the platform already defines `ariaLabel` on every
  // HTMLElement. The rest still carries the component's own props -- saying so is what
  // a destructured `$props()` no longer infers on its own.
  // `attributes` is renamed for the same reason `ariaLabel` is, but with a sharper
  // consequence. `Element.prototype.attributes` is a native accessor, and Svelte's
  // custom-element layer ITERATES `this.attributes` while syncing attributes onto
  // props -- so declaring it did not merely shadow the accessor, it threw
  // "this.attributes is not iterable" during render and left `<sui-checkbox>` with an
  // empty shadow root for every consumer. There is no attribute spelling: the value is
  // an object, so it is set as a property.
  let {
    checkboxAriaLabel,
    boxAttributes,
    ...props
  }: Omit<CheckboxProperties, 'ariaLabel' | 'attributes'> & {
    checkboxAriaLabel?: CheckboxProperties['ariaLabel'];
    boxAttributes?: CheckboxProperties['attributes'];
  } = $props();
</script>

<Checkbox {...props} ariaLabel={checkboxAriaLabel} attributes={boxAttributes}>
  {#snippet checkedIcon()}
    <!-- Mirrors Checkbox.svelte's checkedIcon fallback:
         <span class="icon">{@html checkmarkSvg}</span> -->
    <slot name="checked-icon">
      <span class="icon">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html checkmarkSvg}
      </span>
    </slot>
  {/snippet}
  {#snippet indeterminateIcon()}
    <!-- Mirrors Checkbox.svelte's indeterminateIcon fallback:
         <span class="icon dash">{@html minusSvg}</span> -->
    <slot name="indeterminate-icon">
      <span class="icon dash">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html minusSvg}
      </span>
    </slot>
  {/snippet}
</Checkbox>
