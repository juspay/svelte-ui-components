<svelte:options
  customElement={{
    tag: 'sui-combobox',
    shadow: 'open',
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
      ariaLabel: { type: 'String', attribute: 'aria-label' },
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
  import Combobox from '$lib/Combobox/Combobox.svelte';

  // Combobox reassigns all five of these; see ChipInput.wc.svelte for why a one-way spread
  // leaves the host element's properties stale.
  let {
    value = $bindable(''),
    inputValue = $bindable(''),
    open = $bindable(false),
    highlightedIndex = $bindable(-1),
    selected = $bindable([]),
    ...rest
  } = $props();
</script>

<Combobox {...rest} bind:value bind:inputValue bind:open bind:highlightedIndex bind:selected />
