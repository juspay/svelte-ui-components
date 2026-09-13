<svelte:options
  customElement={{
    tag: 'sui-combobox',
    shadow: 'open',
    // `<sui-combobox name="...">` declared a name and submitted nothing: the real
    // input lives in a shadow root, where the surrounding form cannot see it, so
    // it contributed no FormData entry, ignored form.reset() and never took part
    // in constraint validation.
    //
    // `values: 'selected'` is what multi-select needs. `selected` is the bindable
    // array of chosen ids, and each member becomes its own entry under the
    // element's name -- what a native `<select multiple>` submits. In
    // single-select mode `selected` is empty and the control falls through to its
    // own `value`, so nothing changes for the common case.
    // `innerControlIsNotTheValue` because this component's visible `<input>` is
    // the search box: it holds what the user typed, not what they chose. Without
    // it the mixin preferred that empty query over the props and the form
    // collected nothing.
    extend: formAssociated({ values: 'selected', innerControlIsNotTheValue: true }),
    props: {
      items: { type: 'Array' },
      value: { type: 'String', reflect: true },
      inputValue: { type: 'String', attribute: 'input-value' },
      open: { type: 'Boolean', reflect: true },
      highlightedIndex: { type: 'Number', attribute: 'highlighted-index' },
      placeholder: { type: 'String', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      name: { type: 'String', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      noResultsText: { type: 'String', attribute: 'no-results-text' },
      comboboxAriaLabel: { type: 'String', attribute: 'aria-label' },
      multiple: { type: 'Boolean', reflect: true },
      selected: { type: 'Array' },
      maxSelected: { type: 'Number', attribute: 'max-selected' },
      maxSelectedText: { type: 'String', attribute: 'max-selected-text' },
      // Snippet props. Not serialisable, so they carry no attribute and must be assigned as
      // properties -- but they still have to be DECLARED here, or Svelte defines no accessor
      // for them on the custom element and the assignment cannot reach the component at all.
      itemSnippet: { type: 'Object' },
      emptySnippet: { type: 'Object' },
      inputPrefix: { type: 'Object' },
      inputSuffix: { type: 'Object' },
      dropdownHeader: { type: 'Object' },
      dropdownFooter: { type: 'Object' },
      pillSnippet: { type: 'Object' },
      actionIcon: { type: 'Object' },
      allowCreate: { type: 'Boolean', attribute: 'allow-create', reflect: true },
      createLabel: { type: 'Object' },
      action: { type: 'Object' },
      filterFn: { type: 'Object' },
      errorMessage: { type: 'String', attribute: 'error-message' },
      infoMessage: { type: 'String', attribute: 'info-message' },
      invalid: { type: 'Boolean', reflect: true },
      inputProperties: { type: 'Object' },
      inputEventProperties: { type: 'Object' },
      onselect: { type: 'Object' },
      oninput: { type: 'Object' },
      onopen: { type: 'Object' },
      onclose: { type: 'Object' },
      onkeydown: { type: 'Object' },
      onfocus: { type: 'Object' },
      onblur: { type: 'Object' },
      onchange: { type: 'Object' },
      onadd: { type: 'Object' },
      onremove: { type: 'Object' },
      oncreate: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import { formAssociated } from '../form-associated';
  import Combobox from '$lib/Combobox/Combobox.svelte';
  import type { ComboboxProperties } from '$lib/Combobox/properties';
  import { dispatchEvents } from '../dispatch';

  // Combobox reassigns all five of these; see ChipInput.wc.svelte for why a one-way spread
  // leaves the host element's properties stale.
  let {
    comboboxAriaLabel,
    value = $bindable(''),
    inputValue = $bindable(''),
    open = $bindable(false),
    highlightedIndex = $bindable(-1),
    selected = $bindable([]),
    ...rest
  }: Omit<ComboboxProperties, 'ariaLabel'> & {
    comboboxAriaLabel?: ComboboxProperties['ariaLabel'];
  } = $props();

  // `$host()` is called inline rather than held in a `const host`: a `$`-prefixed
  // identifier is Svelte's store-subscription spelling, so a local named `host` makes
  // `$host` read as that store and svelte-check reports the initializer as referencing
  // itself.
  const hasInputPrefixSlot = $host().querySelector('[slot="input-prefix"]') !== null;
  const hasInputSuffixSlot = $host().querySelector('[slot="input-suffix"]') !== null;
  const hasEmptySnippetSlot = $host().querySelector('[slot="empty-snippet"]') !== null;
  const hasActionIconSlot = $host().querySelector('[slot="action-icon"]') !== null;

  // dispatchEvents needs an actual value to call methods on, not another inline
  // `$host()` call per use -- named hostEl, not host, for the same reason as above:
  // svelte2tsx confuses a local variable named after a rune's name minus its `$` with
  // the rune itself (sveltejs/svelte#13715), reporting `$host` as used before its
  // declaration.
  const hostEl = $host();

  // onselect, oninput, onclose, onkeydown, onfocus, onblur, and onchange collide
  // with HTMLElement's own accessors with no recorded exception, so dispatchEvents
  // leaves those seven callback-only. onopen, onadd, onremove, and oncreate collide with
  // nothing and dispatch 'open', 'add', 'remove', 'create' -- each a 0- or 1-argument
  // callback (Combobox/properties.ts), so `detail` is exactly that argument (or absent
  // for onopen) with no CALLBACK_ARGUMENT_NAMES entry needed.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, rest));
</script>

<!--
  `emptySnippet` and `actionIcon` are passed as attribute expressions on every
  <Combobox> tag below rather than as a fifth and sixth branch, because each is
  independent of the inputPrefix/inputSuffix combination that already needs four
  branches -- a fifth and sixth binary flag on top of that would need sixteen. Their
  snippet bodies read `rest.emptySnippet` / `rest.actionIcon` (the JS-assigned
  fallback) before falling back to the slot, which is what keeps a `{#snippet}`
  declared at the template's top level from being hoisted to module scope in the
  first place: hoisting is decided per snippet by whether its body references
  anything from instance scope, and a bare, unconditional `<slot>` has nothing to
  reference. Verified against the compiled output: an otherwise-identical top-level
  snippet with no such reference is lifted above the component function, where
  `$$props` does not exist, and throws the moment it renders.

  `emptySnippet`'s own default is `<div class="combobox-empty">{noResultsText}</div>`
  in Combobox.svelte -- a scoped class that has no effect written from this file, so
  the fallback below reproduces the same look with the same CSS custom properties
  instead of the class, and reads the same `noResultsText` default
  ('No results') so an unset one matches exactly.
-->
{#snippet emptySnippetImpl()}
  {#if rest.emptySnippet}{@render rest.emptySnippet()}{:else}<slot name="empty-snippet"
      ><div
        style={`padding: var(--combobox-empty-padding, 8px 12px); color: var(--combobox-empty-color, #999999); font-style: var(--combobox-empty-font-style, italic);`}
      >
        {rest.noResultsText ?? 'No results'}
      </div></slot
    >{/if}
{/snippet}
{#snippet actionIconImpl()}
  {#if rest.actionIcon}{@render rest.actionIcon()}{:else}<slot name="action-icon"></slot>{/if}
{/snippet}

<!--
  `dropdownHeader` and `dropdownFooter` are supplied unconditionally: neither has an
  `{:else}` default to destroy, and the wrapper Combobox draws around each one is
  `border: none; padding: 0` by default, so an empty header or footer occupies no
  space. A property-assigned snippet still wins; the slot is the fallback. The cost of
  not guarding them is narrow but real and is documented on the page: the `<div>`s are
  now always in the dropdown, so a consumer who themes `--combobox-dropdown-header-border`
  or `-padding` sees it on an empty header too.

  `inputPrefix` and `inputSuffix` have no default either, but their wrappers are NOT
  inert -- `.combobox-input-prefix` carries `padding-left: var(--combobox-input-prefix-padding, 8px)`
  and the suffix the matching `padding-right`. Always supplying those snippets would
  inset the text of every `<sui-combobox>` in the library by 8px around an empty box,
  so they are claimed only when the consumer really slotted something, which also
  leaves a JS-assigned property working when they did not.

  Four branches rather than two conditional snippet props, for the reason
  PieChart.wc.svelte states: a `{#snippet}` declared at the top level of the template is
  hoisted to module scope, while the `<slot>` inside it compiles to
  `$.slot(node, $$props, …)` -- and `$$props` only exists inside the component function.
  The hoisted version throws `$$props is not defined` the moment the snippet is
  rendered, which shows up as a silently empty shadow root rather than as a build error.

  `emptySnippet` and `actionIcon` are guarded too -- `emptySnippet` has a real
  `{:else}` default (`<div class="combobox-empty">{noResultsText}</div>`, whose
  styling comes from a scoped class this wrapper cannot reproduce, so its fallback
  below reads the same CSS custom properties by hand instead), and `actionIcon`'s
  span sits in a `gap: var(--combobox-option-gap, 8px)` flex row, so an empty one
  indents the action label. Rather than doubling the branch count above to sixteen,
  both are passed as plain attribute expressions on every <Combobox> tag -- see the
  comment just above their `{#snippet}` declarations for why that stays out of
  hoisted scope.

  `itemSnippet` and `pillSnippet` stay out for a different reason: both are
  parameterized (`Snippet<[ComboboxItem, boolean]>` and
  `Snippet<[string, () => void, boolean]>`), and a `<slot>` cannot receive arguments.
-->
{#if hasInputPrefixSlot && hasInputSuffixSlot}
  <Combobox
    {...rest}
    {...dispatchers}
    ariaLabel={comboboxAriaLabel}
    bind:value
    bind:inputValue
    bind:open
    bind:highlightedIndex
    bind:selected
    emptySnippet={hasEmptySnippetSlot ? emptySnippetImpl : rest.emptySnippet}
    actionIcon={hasActionIconSlot ? actionIconImpl : rest.actionIcon}
  >
    {#snippet dropdownHeader()}
      {#if rest.dropdownHeader}{@render rest.dropdownHeader()}{:else}<slot name="dropdown-header"
        ></slot>{/if}
    {/snippet}
    {#snippet dropdownFooter()}
      {#if rest.dropdownFooter}{@render rest.dropdownFooter()}{:else}<slot name="dropdown-footer"
        ></slot>{/if}
    {/snippet}
    {#snippet inputPrefix()}
      <slot name="input-prefix"></slot>
    {/snippet}
    {#snippet inputSuffix()}
      <slot name="input-suffix"></slot>
    {/snippet}
  </Combobox>
{:else if hasInputPrefixSlot}
  <Combobox
    {...rest}
    {...dispatchers}
    ariaLabel={comboboxAriaLabel}
    bind:value
    bind:inputValue
    bind:open
    bind:highlightedIndex
    bind:selected
    emptySnippet={hasEmptySnippetSlot ? emptySnippetImpl : rest.emptySnippet}
    actionIcon={hasActionIconSlot ? actionIconImpl : rest.actionIcon}
  >
    {#snippet dropdownHeader()}
      {#if rest.dropdownHeader}{@render rest.dropdownHeader()}{:else}<slot name="dropdown-header"
        ></slot>{/if}
    {/snippet}
    {#snippet dropdownFooter()}
      {#if rest.dropdownFooter}{@render rest.dropdownFooter()}{:else}<slot name="dropdown-footer"
        ></slot>{/if}
    {/snippet}
    {#snippet inputPrefix()}
      <slot name="input-prefix"></slot>
    {/snippet}
  </Combobox>
{:else if hasInputSuffixSlot}
  <Combobox
    {...rest}
    {...dispatchers}
    ariaLabel={comboboxAriaLabel}
    bind:value
    bind:inputValue
    bind:open
    bind:highlightedIndex
    bind:selected
    emptySnippet={hasEmptySnippetSlot ? emptySnippetImpl : rest.emptySnippet}
    actionIcon={hasActionIconSlot ? actionIconImpl : rest.actionIcon}
  >
    {#snippet dropdownHeader()}
      {#if rest.dropdownHeader}{@render rest.dropdownHeader()}{:else}<slot name="dropdown-header"
        ></slot>{/if}
    {/snippet}
    {#snippet dropdownFooter()}
      {#if rest.dropdownFooter}{@render rest.dropdownFooter()}{:else}<slot name="dropdown-footer"
        ></slot>{/if}
    {/snippet}
    {#snippet inputSuffix()}
      <slot name="input-suffix"></slot>
    {/snippet}
  </Combobox>
{:else}
  <Combobox
    {...rest}
    {...dispatchers}
    ariaLabel={comboboxAriaLabel}
    bind:value
    bind:inputValue
    bind:open
    bind:highlightedIndex
    bind:selected
    emptySnippet={hasEmptySnippetSlot ? emptySnippetImpl : rest.emptySnippet}
    actionIcon={hasActionIconSlot ? actionIconImpl : rest.actionIcon}
  >
    {#snippet dropdownHeader()}
      {#if rest.dropdownHeader}{@render rest.dropdownHeader()}{:else}<slot name="dropdown-header"
        ></slot>{/if}
    {/snippet}
    {#snippet dropdownFooter()}
      {#if rest.dropdownFooter}{@render rest.dropdownFooter()}{:else}<slot name="dropdown-footer"
        ></slot>{/if}
    {/snippet}
  </Combobox>
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
    display: var(--sui-combobox-display, block);
  }
</style>
