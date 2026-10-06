<svelte:options
  customElement={{
    tag: 'sui-select',
    shadow: 'open',
    // Select renders one `<input type="hidden" name value>` per selected id, which is
    // how the Svelte build submits (docs/Select.md). Inside `<sui-select>` those inputs
    // sit in a shadow root, and a form cannot see across one -- so the element declared
    // `name` and `value`, looked form-associated, and contributed nothing to FormData.
    //
    // `values: 'value'` because Select's `value` is a `string[]` for both single and
    // multiple: ElementInternals takes a FormData, so one control contributes one entry
    // per selection under its own name -- the same shape a native `<select multiple>`
    // submits, and the same shape the hidden inputs produce for the Svelte build.
    //
    // `innerControlIsNotTheValue` because a searchable Select owns a text input; without
    // it the mixin would submit whatever had been typed into the search box instead of
    // the selection. Combobox needed this for the same reason.
    extend: formAssociated({ values: 'value', innerControlIsNotTheValue: true }),
    props: {
      items: { type: 'Object' },
      value: { type: 'Object' },
      multiple: { type: 'Boolean', reflect: true },
      searchable: { type: 'Boolean', reflect: true },
      searchPosition: { type: 'String', attribute: 'search-position' },
      placeholder: { type: 'String', reflect: true },
      selectAriaLabel: { type: 'String', attribute: 'aria-label', reflect: true },
      selectAriaLabelledby: { type: 'String', attribute: 'aria-labelledby' },
      disabled: { type: 'Boolean', reflect: true },
      error: { type: 'Boolean', reflect: true },
      errorMessage: { type: 'String', attribute: 'error-message' },
      clearable: { type: 'Boolean', reflect: true },
      onclear: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      itemTestId: { type: 'String', attribute: 'item-test-id' },
      classes: { type: 'String' },
      open: { type: 'Boolean', reflect: true },
      dropdownAlign: { type: 'String', attribute: 'dropdown-align' },
      placement: { type: 'String', attribute: 'placement' },
      showSelectAll: { type: 'Boolean', attribute: 'show-select-all', reflect: true },
      selectAllLabel: { type: 'String', attribute: 'select-all-label' },
      onchange: { type: 'Object' },
      leftIcon: { type: 'String', attribute: 'left-icon', reflect: true },
      leftIconTestId: { type: 'String', attribute: 'left-icon-test-id' },
      bottomContent: { type: 'Object' },
      optionIndicator: { type: 'Object' },
      showSelectedTick: { type: 'Boolean', attribute: 'show-selected-tick' },
      triggerSummary: { type: 'Object' },
      onopen: { type: 'Object' },
      onclose: { type: 'Object' },
      hierarchy: { type: 'String', attribute: 'hierarchy' },
      usePortal: { type: 'Boolean', attribute: 'use-portal' },
      name: { type: 'String', reflect: true }
    }
  }}
/>

<script lang="ts">
  import { formAssociated } from '../form-associated';
  import Select from '$lib/Select/Select.svelte';
  import type { SelectProperties } from '$lib/Select/properties';
  import { dispatchEvents } from '../dispatch';
  import { labelRootOf, watchReferencedText } from '../label-reference';

  // The element renames `ariaLabel`/`ariaLabelledby` because ARIAMixin already
  // defines `ariaLabel` on every HTMLElement and a same-named prop would replace the
  // platform's accessor -- the collision `190800b` renamed 24 other props to avoid.
  // The attributes are unchanged: `<sui-select aria-label="Country">` works, and only
  // the JavaScript property name differs.
  let {
    selectAriaLabel,
    selectAriaLabelledby,
    ...props
  }: Omit<SelectProperties, 'ariaLabel' | 'ariaLabelledby'> & {
    selectAriaLabel?: SelectProperties['ariaLabel'];
    selectAriaLabelledby?: SelectProperties['ariaLabelledby'];
  } = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onclear and onopen do not collide with a native HTMLElement handler, so
  // they dispatch 'clear' and 'open' (both 0-argument, no detail) for a consumer
  // who only calls addEventListener. onchange and onclose DO collide (with
  // HTMLElement's own change/close accessors), so both stay callback-only --
  // unchanged from before this wiring.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));

  // `aria-labelledby` cannot be forwarded to the combobox the way `aria-label` can.
  // The trigger lives in this element's shadow root and ARIA id references do not
  // cross a shadow boundary, so an id naming a label in the consumer's page would
  // resolve to nothing and leave the control unnamed -- a prop that looks wired and
  // does nothing. The ids are resolved on the HOST's root instead and the text is
  // forwarded as `aria-label`, a string, which crosses fine. It is watched, so a
  // label rendered after the element, edited, or replaced keeps the name current.
  // The explicit label still wins when both are set, following Select's API contract.
  let referencedLabel: SelectProperties['ariaLabel'] = $state();

  // An effect rather than $derived: the label is looked up in the consumer's DOM,
  // which is not reactive state, and there is no root to search until the element is
  // connected to a document.
  $effect(() => {
    const root = labelRootOf(hostEl);
    if (root === null) {
      referencedLabel = undefined;
      return;
    }
    return watchReferencedText(
      root,
      selectAriaLabelledby,
      (text) => {
        referencedLabel = text;
      },
      () => labelRootOf(hostEl)
    );
  });
</script>

<!-- `ariaLabelledby` is still forwarded so the prop stays reachable, but it is the
     fallback rather than the mechanism: Select.svelte drops aria-labelledby whenever
     aria-label is a string, so the resolved name above wins and the raw id is only
     emitted when the reference resolved to nothing, where it is inert either way. -->
<Select
  {...props}
  {...dispatchers}
  ariaLabel={selectAriaLabel?.trim() ? selectAriaLabel : referencedLabel}
  ariaLabelledby={selectAriaLabelledby}
>
  {#snippet bottomContent()}
    <slot name="bottom-content"></slot>
  {/snippet}
</Select>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-select-display, block);
  }
</style>
