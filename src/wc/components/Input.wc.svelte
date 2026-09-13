<svelte:options
  customElement={{
    tag: 'sui-input',
    shadow: 'open',
    extend: formAssociated({ disabled: 'disable' }),
    props: {
      value: { type: 'String', reflect: true },
      placeholder: { type: 'String', reflect: true },
      dataType: { type: 'String', reflect: true, attribute: 'data-type' },
      label: { type: 'String', reflect: true },
      onErrorMessage: { type: 'String', attribute: 'on-error-message' },
      infoMessage: { type: 'String', attribute: 'info-message' },
      validators: { type: 'Object' },
      disable: { type: 'Boolean', reflect: true },
      validationPattern: { type: 'Object' },
      inProgressPattern: { type: 'Object' },
      addFocusColor: { type: 'Boolean', attribute: 'add-focus-color' },
      maxLength: { type: 'Number', reflect: true, attribute: 'max-length' },
      minLength: { type: 'Number', reflect: true, attribute: 'min-length' },
      actionInput: { type: 'Boolean', attribute: 'action-input' },
      useTextArea: { type: 'Boolean', reflect: true, attribute: 'use-text-area' },
      autoComplete: { type: 'String', attribute: 'auto-complete' },
      inputMode: { type: 'String', attribute: 'input-mode' },
      name: { type: 'String', reflect: true },
      inputId: { type: 'String', attribute: 'id' },
      inputAriaLabel: { type: 'String', attribute: 'aria-label' },
      textTransformers: { type: 'Object' },
      textViewPresentation: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      leftIcon: { type: 'Object' },
      rightIcon: { type: 'Object' },
      leftIconLabel: { type: 'String', attribute: 'left-icon-label' },
      rightIconLabel: { type: 'String', attribute: 'right-icon-label' },
      mandatory: { type: 'Boolean', reflect: true },
      required: { type: 'Boolean', reflect: true },
      forceError: { type: 'Boolean', reflect: true, attribute: 'force-error' },
      readonly: { type: 'Boolean', attribute: 'readonly' },
      // Not 'Boolean': Svelte's boolean conversion is presence-based, mapping any
      // non-null attribute value to true, so `spellcheck="false"` — the only
      // spelling that turns spell checking off — arrived as true. The prop is a
      // tri-state (`boolean | null`, default null = "leave the browser alone"),
      // which a presence-based boolean cannot express at all.
      spellcheck: { type: 'String', attribute: 'spellcheck' },
      min: { type: 'Number', attribute: 'min' },
      max: { type: 'Number', attribute: 'max' },
      ariaAutocomplete: { type: 'String', attribute: 'aria-autocomplete' },
      ariaControls: { type: 'String', attribute: 'aria-controls' },
      ariaActivedescendant: { type: 'String', attribute: 'aria-activedescendant' },
      rows: { type: 'Number', attribute: 'rows' },
      autoResize: { type: 'Boolean', attribute: 'auto-resize' },
      minRows: { type: 'Number', attribute: 'min-rows' },
      maxRows: { type: 'Number', attribute: 'max-rows' },
      resize: { type: 'String', attribute: 'resize' },
      showCount: { type: 'Boolean', attribute: 'show-count' },
      onfocus: { type: 'Object' },
      onfocusout: { type: 'Object' },
      onblur: { type: 'Object' },
      oninput: { type: 'Object' },
      onpaste: { type: 'Object' },
      onclick: { type: 'Object' },
      onkeydown: { type: 'Object' },
      onstatechange: { type: 'Object' },
      onlefticonclick: { type: 'Object' },
      onrighticonclick: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import { formAssociated } from '../form-associated';
  import Input from '$lib/Input/Input.svelte';
  import type { InputProperties } from '$lib/Input/properties';
  import { dispatchEvents } from '../dispatch';
  // The element renames `ariaLabel` to `inputAriaLabel` and `id` to `inputId` because the platform already defines `ariaLabel` and `id` on every
  // HTMLElement. The rest still carries the component's own props -- saying so is what
  // a destructured `$props()` no longer infers on its own.
  let {
    inputAriaLabel,
    inputId,
    ...props
  }: Omit<InputProperties, 'ariaLabel' | 'id'> & {
    inputAriaLabel?: InputProperties['ariaLabel'];
    inputId?: InputProperties['id'];
  } = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onfocusout/onstatechange/onlefticonclick/onrighticonclick do not collide
  // with a native HTMLElement handler, so all four dispatch -- 'focusout',
  // 'statechange', 'lefticonclick', 'righticonclick' -- for a consumer who only
  // calls addEventListener; each carries at most one argument as detail, so none
  // need a CALLBACK_ARGUMENT_NAMES entry. onfocus/onblur/oninput/onpaste/onclick/
  // onkeydown DO collide (recorded in prop-parity.test.ts's
  // KNOWN_HOST_EVENT_HANDLER_DECLARATIONS) and stay callback-only.
  //
  // sui-input is a form-associated element (`extend: formAssociated(...)` above),
  // which registers a SUBCLASS one prototype level below `hostEl`'s immediate
  // prototype -- declaredCallbackPropNames (src/wc/dispatch.ts) walks the whole
  // chain up to HTMLElement.prototype for exactly this reason, so this still finds
  // every declared callback prop rather than silently wiring nothing. Asserted, not
  // just assumed: see Input.wc.dispatch.test.ts.
  // The capture is safe and the warning does not apply to this shape.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));

  // Restores the tri-state the attribute string flattens: absent stays null so
  // the browser default is untouched, "false" is honoured, and a bare
  // `spellcheck` (empty value, the HTML boolean-attribute idiom) reads as true.
  const asSpellcheck = (value: unknown): boolean | null => {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    const text = String(value).trim().toLowerCase();
    if (text === 'false') {
      return false;
    }
    if (text === '' || text === 'true' || text === 'spellcheck') {
      return true;
    }
    return null;
  };

  /*
   * Input has no `{:else}` default for either icon, so there is no built-in glyph to
   * preserve -- but the props are not inert either. `hasLeftIcon`/`hasRightIcon` also
   * move the field into a `.input-field-wrap` and add
   * `calc(var(--input-icon-size) + var(--input-icon-gap) * 2)` of padding to the
   * control. A wrapper that always supplied the snippet would make that test
   * permanently true and indent every `<sui-input>` in the library by 44px around an
   * empty box. So claim the snippet only when the consumer really slotted something,
   * which also leaves a JS-assigned `leftIcon`/`rightIcon` property working when they
   * did not.
   *
   */
  // Calls $host() again here rather than reusing the hostEl binding above: the
  // contract test (src/wc-content-slots.test.ts, 'keeps left-icon/right-icon
  // fill-aware') does a literal-text check for `$host().querySelector(...)`, and
  // $host() returns the same element either way -- there is no second host to get
  // out of sync with the one dispatchEvents(hostEl, props) above already uses.
  const hasLeftIconSlot = $host().querySelector('[slot="left-icon"]') !== null;
  const hasRightIconSlot = $host().querySelector('[slot="right-icon"]') !== null;
</script>

<!--
  Four branches rather than two conditional snippet props, for the reason
  PieChart.wc.svelte states: a `{#snippet}` declared at the top level of the template
  is hoisted to module scope, while the `<slot>` inside it compiles to
  `$.slot(node, $$props, …)` -- and `$$props` only exists inside the component
  function. The hoisted version throws `$$props is not defined` the moment the snippet
  is rendered, which shows up as a silently empty shadow root rather than as a build
  error. Declaring each snippet inside `<Input>` keeps it in component scope; the
  branching is what makes it conditional without a top-level declaration.
-->
{#if hasLeftIconSlot && hasRightIconSlot}
  <Input
    {...props}
    {...dispatchers}
    id={inputId}
    ariaLabel={inputAriaLabel}
    spellcheck={asSpellcheck(props.spellcheck)}
  >
    {#snippet leftIcon()}
      <slot name="left-icon"></slot>
    {/snippet}
    {#snippet rightIcon()}
      <slot name="right-icon"></slot>
    {/snippet}
  </Input>
{:else if hasLeftIconSlot}
  <Input
    {...props}
    {...dispatchers}
    id={inputId}
    ariaLabel={inputAriaLabel}
    spellcheck={asSpellcheck(props.spellcheck)}
  >
    {#snippet leftIcon()}
      <slot name="left-icon"></slot>
    {/snippet}
  </Input>
{:else if hasRightIconSlot}
  <Input
    {...props}
    {...dispatchers}
    id={inputId}
    ariaLabel={inputAriaLabel}
    spellcheck={asSpellcheck(props.spellcheck)}
  >
    {#snippet rightIcon()}
      <slot name="right-icon"></slot>
    {/snippet}
  </Input>
{:else}
  <Input
    {...props}
    {...dispatchers}
    id={inputId}
    ariaLabel={inputAriaLabel}
    spellcheck={asSpellcheck(props.spellcheck)}
  />
{/if}

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-input-display, block);
  }
</style>
