<script module>
  const trig = '[data-pw="sel"] .select-trigger';
  const opt = (id) => `[data-pw="sel-${id}"]`;
  const openIt = [['click', trig]];
  // Use the open area near the arrow. The center of a multi-select can now
  // contain a chip's own 24px remove target, which is a separate action.
  const openAwayFromChips = [['click', trig, { position: { x: 278, y: 24 } }]];
  const largerTargets = new Set([
    'multiple-closed',
    'multiple-open',
    'multiple-select-two',
    'multiple-deselect',
    'multiple-select-all-click',
    'multiple-select-all-partial',
    'multiple-option-indicator-snippet',
    'clearable-with-value'
  ]);
  export const cases = [
    { name: 'default-closed' },
    { name: 'placeholder' },
    { name: 'string-items' },
    { name: 'preselected' },
    { name: 'preselected-display-label' },
    { name: 'hover-trigger', actions: [['hover', trig]] },
    { name: 'focused-trigger', actions: [['focus', trig]] },
    { name: 'open-by-click', actions: openIt },
    { name: 'open-with-selection', actions: openIt },
    { name: 'open-prop-true' },
    { name: 'open-hover-option', actions: [...openIt, ['hover', opt('b')]] },
    { name: 'open-then-close-by-click', actions: [...openIt, ['click', trig]] },
    { name: 'open-then-escape', actions: [...openIt, ['key', 'Escape']] },
    { name: 'open-then-click-outside', actions: [...openIt, ['mouse', 400, 700]] },
    { name: 'select-single', actions: [...openIt, ['click', opt('b')]] },
    {
      name: 'select-single-reselect',
      actions: [...openIt, ['click', opt('b')], ['click', trig], ['click', opt('c')]]
    },
    {
      name: 'select-single-keyboard',
      actions: [
        ['focus', trig],
        ['key', 'ArrowDown'],
        ['key', 'ArrowDown'],
        ['key', 'Enter']
      ]
    },
    { name: 'select-single-show-tick', actions: openIt },
    {
      name: 'select-disabled-item-click',
      actions: [...openIt, ['click', opt('d'), { force: true }]]
    },
    { name: 'items-with-icons', actions: openIt },
    { name: 'items-long-labels', actions: openIt },
    { name: 'items-many-scroll', actions: openIt },
    { name: 'multiple-closed' },
    { name: 'multiple-open', actions: openAwayFromChips },
    { name: 'multiple-select-two', actions: [...openIt, ['click', opt('a')], ['click', opt('c')]] },
    { name: 'multiple-deselect', actions: [...openAwayFromChips, ['click', opt('a')]] },
    { name: 'multiple-select-all', actions: openIt },
    {
      name: 'multiple-select-all-click',
      actions: [...openIt, ['click', '[data-pw="sel-select-all"]']]
    },
    { name: 'multiple-select-all-partial', actions: openIt },
    { name: 'multiple-select-all-custom-label', actions: openIt },
    { name: 'multiple-option-indicator-snippet', actions: openIt },
    { name: 'multiple-trigger-summary-snippet' },
    {
      name: 'multiple-searchable-filter',
      actions: [
        ['click', '[data-pw="sel-search"]'],
        ['type', '[data-pw="sel-search"]', 'an']
      ]
    },
    { name: 'searchable-trigger', actions: [['click', '[data-pw="sel-search"]']] },
    {
      name: 'searchable-typed',
      actions: [
        ['click', '[data-pw="sel-search"]'],
        ['type', '[data-pw="sel-search"]', 'ban']
      ]
    },
    {
      name: 'searchable-no-results',
      actions: [
        ['click', '[data-pw="sel-search"]'],
        ['type', '[data-pw="sel-search"]', 'zzz']
      ]
    },
    {
      name: 'searchable-select-result',
      actions: [
        ['click', '[data-pw="sel-search"]'],
        ['type', '[data-pw="sel-search"]', 'che'],
        ['key', 'ArrowDown'],
        ['key', 'Enter']
      ]
    },
    { name: 'searchable-menu-position', actions: openIt },
    {
      name: 'searchable-menu-typed',
      actions: [...openIt, ['type', '[data-pw="sel-menu-search"]', 'ap']]
    },
    { name: 'clearable-with-value' },
    { name: 'clearable-click', actions: [['click', '[data-pw="sel-clear"]']] },
    { name: 'clearable-empty' },
    { name: 'disabled' },
    { name: 'disabled-with-value' },
    { name: 'disabled-click-does-nothing', actions: [['click', trig, { force: true }]] },
    { name: 'error' },
    { name: 'error-with-message' },
    { name: 'error-open', actions: openIt },
    { name: 'required' },
    { name: 'hierarchy-ghost' },
    { name: 'hierarchy-ghost-open', actions: openIt },
    { name: 'left-icon' },
    { name: 'dropdown-align-right', actions: openIt },
    { name: 'placement-top-left', actions: openIt },
    { name: 'placement-bottom-right', actions: openIt },
    { name: 'placement-auto', actions: openIt },
    { name: 'bottom-content', actions: openIt },
    { name: 'portal-open', actions: openIt },
    { name: 'aria-label' },
    { name: 'item-test-id', actions: openIt },
    { name: 'native-single' },
    { name: 'native-single-preselected' },
    {
      name: 'native-single-keyboard',
      actions: [
        ['focus', '[data-pw="sel"]'],
        ['key', 'ArrowDown']
      ]
    },
    { name: 'native-multiple' },
    { name: 'native-disabled' },
    { name: 'native-required' },
    { name: 'css-overrides', actions: openIt },
    { name: 'css-overrides-closed' }
  ].map((item) =>
    largerTargets.has(item.name)
      ? { ...item, knownVisualDifference: 'Clear and chip-removal controls have a 24px target.' }
      : item
  );
</script>

<script>
  import { Select } from 'sui-under-test';
  import { log, note, png } from './_kit.js';
  let { name } = $props();

  const fruit = [
    { id: 'a', label: 'Apple' },
    { id: 'b', label: 'Banana' },
    { id: 'c', label: 'Cherry' },
    { id: 'd', label: 'Dragonfruit', disabled: true },
    { id: 'e', label: 'Elderberry' }
  ];
  const displayLabels = [
    { id: 'a', label: 'Apple (red, crunchy)', displayLabel: 'Apple' },
    { id: 'b', label: 'Banana (yellow, soft)', displayLabel: 'Banana' }
  ];
  const withIcons = [
    { id: 'a', label: 'With icon A', icon: png },
    { id: 'b', label: 'With icon B', icon: png },
    { id: 'c', label: 'Without icon' }
  ];
  const longLabels = [
    {
      id: 'a',
      label: 'A really long option label that cannot possibly fit on a single line in the menu'
    },
    { id: 'b', label: 'Short' }
  ];
  const many = Array.from({ length: 30 }, (_, i) => ({
    id: `n${i}`,
    label: `Option number ${i + 1}`
  }));

  const initialValue = {
    preselected: ['b'],
    'preselected-display-label': ['a'],
    'open-with-selection': ['b'],
    'select-single-show-tick': ['b'],
    'multiple-closed': ['a', 'c'],
    'multiple-open': ['a', 'c'],
    'multiple-deselect': ['a', 'c'],
    'multiple-select-all-partial': ['a'],
    'multiple-trigger-summary-snippet': ['a', 'b', 'c'],
    'clearable-with-value': ['b'],
    'clearable-click': ['b'],
    'disabled-with-value': ['b'],
    'hierarchy-ghost-open': ['a'],
    'native-single-preselected': ['b'],
    'native-multiple': ['a', 'c'],
    'css-overrides': ['b'],
    'css-overrides-closed': ['b'],
    'multiple-option-indicator-snippet': ['a']
  };
  let value = $state(initialValue[name] ?? []);
  let open = $state(name === 'open-prop-true');
  $effect(() => note('value', value));
  $effect(() => note('open', open));

  const handlers = {
    onchange: log('onchange'),
    onclear: log('onclear'),
    onopen: log('onopen'),
    onclose: log('onclose')
  };
  const multiNames = new Set([
    'multiple-closed',
    'multiple-open',
    'multiple-select-two',
    'multiple-deselect',
    'multiple-select-all',
    'multiple-select-all-click',
    'multiple-select-all-partial',
    'multiple-select-all-custom-label'
  ]);
  const wrapTop = {
    'placement-top-left': 'margin-top: 420px;',
    'placement-auto': 'margin-top: 420px;'
  };
</script>

<div style="width: 300px; padding: 8px; min-height: 600px; {wrapTop[name] ?? ''}">
  {#if name === 'default-closed'}
    <Select bind:value bind:open items={fruit} testId="sel" {...handlers} />
  {:else if name === 'placeholder'}
    <Select
      bind:value
      bind:open
      items={fruit}
      placeholder="Pick a fruit"
      testId="sel"
      {...handlers}
    />
  {:else if name === 'string-items'}
    <Select
      bind:value
      bind:open
      items={['Red', 'Green', 'Blue']}
      placeholder="Colour"
      testId="sel"
      {...handlers}
    />
  {:else if name === 'preselected'}
    <Select bind:value bind:open items={fruit} placeholder="Pick" testId="sel" {...handlers} />
  {:else if name === 'preselected-display-label'}
    <Select
      bind:value
      bind:open
      items={displayLabels}
      placeholder="Pick"
      testId="sel"
      {...handlers}
    />
  {:else if name === 'hover-trigger' || name === 'focused-trigger' || name === 'open-by-click' || name === 'open-then-close-by-click' || name === 'open-then-escape' || name === 'open-then-click-outside' || name === 'open-hover-option' || name === 'open-with-selection' || name === 'select-single' || name === 'select-single-reselect' || name === 'select-single-keyboard' || name === 'select-disabled-item-click'}
    <Select
      bind:value
      bind:open
      items={fruit}
      placeholder="Pick a fruit"
      testId="sel"
      {...handlers}
    />
  {:else if name === 'open-prop-true'}
    <Select
      bind:value
      bind:open
      items={fruit}
      placeholder="Pick a fruit"
      testId="sel"
      {...handlers}
    />
  {:else if name === 'select-single-show-tick'}
    <Select
      bind:value
      bind:open
      items={fruit}
      showSelectedTick
      placeholder="Pick"
      testId="sel"
      {...handlers}
    />
  {:else if name === 'items-with-icons'}
    <Select bind:value bind:open items={withIcons} placeholder="Pick" testId="sel" {...handlers} />
  {:else if name === 'items-long-labels'}
    <Select bind:value bind:open items={longLabels} placeholder="Pick" testId="sel" {...handlers} />
  {:else if name === 'items-many-scroll'}
    <Select bind:value bind:open items={many} placeholder="Pick" testId="sel" {...handlers} />
  {:else if multiNames.has(name) && !name.startsWith('multiple-select-all')}
    <Select
      bind:value
      bind:open
      items={fruit}
      multiple
      placeholder="Pick fruits"
      testId="sel"
      {...handlers}
    />
  {:else if name === 'multiple-select-all' || name === 'multiple-select-all-click' || name === 'multiple-select-all-partial'}
    <Select
      bind:value
      bind:open
      items={fruit}
      multiple
      showSelectAll
      placeholder="Pick fruits"
      testId="sel"
      {...handlers}
    />
  {:else if name === 'multiple-select-all-custom-label'}
    <Select
      bind:value
      bind:open
      items={fruit}
      multiple
      showSelectAll
      selectAllLabel="Everything"
      placeholder="Pick fruits"
      testId="sel"
      {...handlers}
    />
  {:else if name === 'multiple-option-indicator-snippet'}
    <Select
      bind:value
      bind:open
      items={fruit}
      multiple
      placeholder="Pick fruits"
      testId="sel"
      {...handlers}
    >
      {#snippet optionIndicator({ checked })}<span data-pw="ind">{checked ? '[x]' : '[ ]'}</span
        >{/snippet}
    </Select>
  {:else if name === 'multiple-trigger-summary-snippet'}
    <Select
      bind:value
      bind:open
      items={fruit}
      multiple
      placeholder="Pick fruits"
      testId="sel"
      {...handlers}
    >
      {#snippet triggerSummary({ value: v, items })}{v.length} of {items.length} chosen{/snippet}
    </Select>
  {:else if name === 'multiple-searchable-filter'}
    <Select
      bind:value
      bind:open
      items={fruit}
      multiple
      searchable
      placeholder="Search fruits"
      testId="sel"
      {...handlers}
    />
  {:else if name === 'searchable-trigger' || name === 'searchable-typed' || name === 'searchable-no-results' || name === 'searchable-select-result'}
    <Select
      bind:value
      bind:open
      items={fruit}
      searchable
      placeholder="Search fruits"
      testId="sel"
      {...handlers}
    />
  {:else if name === 'searchable-menu-position' || name === 'searchable-menu-typed'}
    <Select
      bind:value
      bind:open
      items={fruit}
      searchable
      searchPosition="menu"
      placeholder="Pick"
      testId="sel"
      {...handlers}
    />
  {:else if name === 'clearable-with-value' || name === 'clearable-click' || name === 'clearable-empty'}
    <Select
      bind:value
      bind:open
      items={fruit}
      clearable
      placeholder="Pick"
      testId="sel"
      {...handlers}
    />
  {:else if name === 'disabled' || name === 'disabled-with-value' || name === 'disabled-click-does-nothing'}
    <Select
      bind:value
      bind:open
      items={fruit}
      disabled
      placeholder="Disabled"
      testId="sel"
      {...handlers}
    />
  {:else if name === 'error' || name === 'error-open'}
    <Select
      bind:value
      bind:open
      items={fruit}
      error
      placeholder="Pick"
      testId="sel"
      {...handlers}
    />
  {:else if name === 'error-with-message'}
    <Select
      bind:value
      bind:open
      items={fruit}
      error
      errorMessage="Please choose a fruit"
      placeholder="Pick"
      testId="sel"
      {...handlers}
    />
  {:else if name === 'required'}
    <Select
      bind:value
      bind:open
      items={fruit}
      required
      placeholder="Required"
      testId="sel"
      {...handlers}
    />
  {:else if name === 'hierarchy-ghost' || name === 'hierarchy-ghost-open'}
    <Select
      bind:value
      bind:open
      items={fruit}
      hierarchy="ghost"
      placeholder="Ghost"
      testId="sel"
      {...handlers}
    />
  {:else if name === 'left-icon'}
    <Select
      bind:value
      bind:open
      items={fruit}
      leftIcon={png}
      leftIconTestId="sel-left-icon"
      placeholder="With icon"
      testId="sel"
      {...handlers}
    />
  {:else if name === 'dropdown-align-right'}
    <Select
      bind:value
      bind:open
      items={fruit}
      dropdownAlign="right"
      placeholder="Align right"
      testId="sel"
      {...handlers}
    />
  {:else if name === 'placement-top-left'}
    <Select
      bind:value
      bind:open
      items={fruit}
      placement="top-left"
      placeholder="Opens up"
      testId="sel"
      {...handlers}
    />
  {:else if name === 'placement-bottom-right'}
    <Select
      bind:value
      bind:open
      items={fruit}
      placement="bottom-right"
      placeholder="Bottom right"
      testId="sel"
      {...handlers}
    />
  {:else if name === 'placement-auto'}
    <Select
      bind:value
      bind:open
      items={fruit}
      placement="auto"
      placeholder="Auto"
      testId="sel"
      {...handlers}
    />
  {:else if name === 'bottom-content'}
    <Select bind:value bind:open items={fruit} placeholder="Pick" testId="sel" {...handlers}>
      {#snippet bottomContent()}<div style="padding: 8px; font-size: 12px">
          Footer content
        </div>{/snippet}
    </Select>
  {:else if name === 'portal-open'}
    <Select
      bind:value
      bind:open
      items={fruit}
      usePortal
      placeholder="Portal"
      testId="sel"
      {...handlers}
    />
  {:else if name === 'aria-label'}
    <Select
      bind:value
      bind:open
      items={fruit}
      ariaLabel="Fruit chooser"
      placeholder="Pick"
      testId="sel"
      {...handlers}
    />
  {:else if name === 'item-test-id'}
    <Select
      bind:value
      bind:open
      items={fruit}
      itemTestId="fruit"
      placeholder="Pick"
      testId="sel"
      {...handlers}
    />
  {:else if name === 'native-single' || name === 'native-single-preselected' || name === 'native-single-keyboard'}
    <Select bind:value items={fruit} native ariaLabel="Fruit" testId="sel" {...handlers} />
  {:else if name === 'native-multiple'}
    <Select bind:value items={fruit} native multiple ariaLabel="Fruit" testId="sel" {...handlers} />
  {:else if name === 'native-disabled'}
    <Select bind:value items={fruit} native disabled ariaLabel="Fruit" testId="sel" {...handlers} />
  {:else if name === 'native-required'}
    <Select bind:value items={fruit} native required ariaLabel="Fruit" testId="sel" {...handlers} />
  {:else if name === 'css-overrides' || name === 'css-overrides-closed'}
    <div
      style="--select-color: #7c2d12; --select-trigger-background: #ffedd5; --select-trigger-border: 2px solid #c2410c; --select-trigger-border-radius: 12px; --select-trigger-min-height: 48px; --select-trigger-padding: 8px 20px; --select-font-size: 14px; --select-arrow-color: #c2410c; --select-dropdown-background: #fff7ed; --select-dropdown-border: 2px solid #c2410c; --select-dropdown-border-radius: 12px; --select-dropdown-shadow: none; --select-error-message-color: #0a7d33;"
    >
      <Select bind:value bind:open items={fruit} placeholder="Styled" testId="sel" {...handlers} />
    </div>
  {/if}
</div>
