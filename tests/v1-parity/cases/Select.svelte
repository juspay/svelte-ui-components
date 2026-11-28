<script context="module">
  const open = ['click', '.selected'];
  const item = (n) => ['click', `[data-pw="opt-${n}"]`];

  export const cases = [
    { name: 'default', allowBlank: true },
    { name: 'closed-placeholder' },
    { name: 'closed-string-selected' },
    { name: 'closed-label-set' },
    { name: 'closed-label-empty-string' },
    { name: 'closed-show-selected-false' },
    { name: 'label-empty' },
    { name: 'label-null' },
    { name: 'empty-items' },
    { name: 'hide-dropdown-icon' },
    { name: 'icon-alt' },
    { name: 'open-single', actions: [open] },
    { name: 'open-selected-hidden', actions: [open] },
    { name: 'open-selected-in-dropdown', actions: [open] },
    { name: 'open-selected-in-dropdown-padded', actions: [open] },
    { name: 'pick-item', actions: [open, item('Cherry')] },
    { name: 'pick-then-reopen', actions: [open, item('Cherry'), open] },
    { name: 'pick-twice', actions: [open, item('Cherry'), open, item('Apple')] },
    { name: 'pick-replaces-label', actions: [open, item('Cherry')] },
    { name: 'toggle-close', actions: [open, open] },
    { name: 'outside-click-closes', actions: [open, ['mouse', 400, 780]] },
    {
      name: 'keydown',
      actions: [
        ['press', '.selected', 'Enter'],
        open,
        ['press', '[data-pw="opt-Apple"]', 'ArrowDown']
      ]
    },
    { name: 'hover-selected', actions: [['hover', '.selected']] },
    { name: 'hover-item', actions: [open, ['hover', '.item-list .item:nth-child(2)']] },
    { name: 'focus-selected', actions: [['focus', '.selected']] },
    { name: 'multi-empty' },
    { name: 'multi-open', actions: [open] },
    { name: 'multi-selected' },
    { name: 'multi-selected-open', actions: [open] },
    { name: 'multi-labels-differ' },
    { name: 'multi-labels-differ-in-dropdown' },
    { name: 'multi-labels-empty-array' },
    { name: 'multi-show-selected-false' },
    { name: 'multi-null-label' },
    { name: 'multi-pick', actions: [open, item('Apple')] },
    { name: 'multi-pick-two', actions: [open, item('Apple'), item('Date')] },
    { name: 'multi-pick-null-label', actions: [open, item('Apple')] },
    { name: 'multi-unpick', actions: [open, item('Apple')] },
    { name: 'multi-select-all', actions: [open, ['click', '.select-all-btn button']] },
    { name: 'multi-select-all-checkbox', actions: [open, ['click', '.select-all-btn input']] },
    { name: 'multi-clear-all', actions: [open, ['click', '.select-all-btn button']] },
    {
      name: 'multi-select-then-clear',
      actions: [open, ['click', '.select-all-btn button'], ['click', '.select-all-btn button']]
    },
    { name: 'multi-apply', actions: [open, ['click', '.apply-btn-container button']] },
    {
      name: 'multi-apply-disabled',
      actions: [open, ['click', '.apply-btn-container button', { force: true }]]
    },
    { name: 'multi-single-select-button', actions: [open] },
    { name: 'multi-count' },
    { name: 'multi-count-zero' },
    { name: 'multi-count-single-mode' },
    { name: 'left-icon' },
    { name: 'left-icon-no-slot' },
    { name: 'left-slot-no-icon' },
    { name: 'left-icon-style' },
    { name: 'bottom-content-open', actions: [open] },
    { name: 'bottom-content-closed' },
    { name: 'bottom-content-multi', actions: [open] },
    { name: 'long-list-open', actions: [open] },
    { name: 'long-list-pick-last', actions: [open, item('Item 20')] },
    { name: 'long-item-text', actions: [open] },
    { name: 'test-ids-click', actions: [['click', '[data-pw="sel"]'], item('Date')] },
    { name: 'test-ids-default', actions: [open, ['click', '[data-pw="undefined-Apple"]']] },
    { name: 'themed-closed' },
    { name: 'themed-open', actions: [open] },
    { name: 'themed-multi-open', actions: [open] },
    { name: 'themed-long-list', actions: [open] },
    { name: 'style-props' },
    { name: 'style-props-open', actions: [open] }
  ];
</script>

<script>
  import { Select } from 'sui-v1-under-test';
  import { log, note, svg, png } from './_kit.js';
  export let name;

  const fruits = ['Apple', 'Banana', 'Cherry', 'Date'];
  const many = Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`);
  const base = {
    placeholder: 'Pick a fruit',
    label: 'Fruit',
    allItems: fruits,
    selectedItem: '',
    selectedItemLabel: null,
    showSelectedItemInDropdown: false,
    selectMultipleItems: false,
    hideDropDownIcon: false,
    dropDownIcon: svg,
    leftIcon: null,
    showSingleSelectButton: null,
    showSelectedItem: true,
    showSelectedItemCount: false,
    testId: 'sel',
    labelTestId: 'sel-label',
    itemTestId: 'opt'
  };
  const multi = { ...base, selectMultipleItems: true, selectedItem: [], selectedItemLabel: [] };
  const two = { selectedItem: ['Apple', 'Cherry'], selectedItemLabel: ['Apple', 'Cherry'] };
  const leftIcon = { src: png, alt: 'left', fallback: null };
  const noIds = { ...base };
  delete noIds.testId;
  delete noIds.labelTestId;
  delete noIds.itemTestId;

  const variants = {
    'closed-string-selected': { ...base, selectedItem: 'Banana' },
    'closed-label-set': { ...base, selectedItem: 'Banana', selectedItemLabel: 'Bananas (ripe)' },
    'closed-label-empty-string': { ...base, selectedItem: 'Banana', selectedItemLabel: '' },
    'closed-show-selected-false': {
      ...base,
      selectedItem: 'Banana',
      selectedItemLabel: 'Bananas',
      showSelectedItem: false
    },
    'label-empty': { ...base, label: '' },
    'label-null': { ...base, label: null },
    'empty-items': { ...base, allItems: [] },
    'hide-dropdown-icon': { ...base, hideDropDownIcon: true },
    'open-selected-hidden': { ...base, selectedItem: 'Banana' },
    'open-selected-in-dropdown': {
      ...base,
      selectedItem: 'Banana',
      showSelectedItemInDropdown: true
    },
    'open-selected-in-dropdown-padded': {
      ...base,
      selectedItem: ' Banana ',
      showSelectedItemInDropdown: true
    },
    'pick-replaces-label': { ...base, selectedItem: 'Banana', selectedItemLabel: 'Bananas' },
    'multi-empty': multi,
    'multi-open': multi,
    'multi-pick': multi,
    'multi-pick-two': multi,
    'multi-select-all': multi,
    'multi-select-all-checkbox': multi,
    'multi-select-then-clear': multi,
    'multi-apply-disabled': multi,
    'multi-selected': { ...multi, ...two },
    'multi-selected-open': { ...multi, ...two },
    'multi-labels-differ': {
      ...multi,
      selectedItem: ['Apple', 'Cherry'],
      selectedItemLabel: ['Red', 'Dark']
    },
    'multi-labels-differ-in-dropdown': {
      ...multi,
      selectedItem: ['Apple', 'Cherry'],
      selectedItemLabel: ['Red', 'Dark'],
      showSelectedItemInDropdown: true
    },
    'multi-labels-empty-array': {
      ...multi,
      selectedItem: ['Apple', 'Cherry'],
      selectedItemLabel: []
    },
    'multi-show-selected-false': { ...multi, ...two, showSelectedItem: false },
    'multi-null-label': { ...multi, selectedItem: ['Apple', 'Cherry'], selectedItemLabel: null },
    'multi-pick-null-label': { ...multi, selectedItemLabel: null },
    'multi-unpick': { ...multi, ...two, showSelectedItemInDropdown: true },
    'multi-clear-all': {
      ...multi,
      selectedItem: [...fruits],
      selectedItemLabel: [...fruits],
      showSelectedItemInDropdown: true
    },
    'multi-apply': { ...multi, ...two },
    'multi-single-select-button': { ...multi, showSingleSelectButton: true },
    'multi-count': { ...multi, ...two, showSelectedItemCount: true },
    'multi-count-zero': { ...multi, showSelectedItemCount: true },
    'multi-count-single-mode': { ...base, selectedItem: 'Apple', showSelectedItemCount: true },
    'left-icon': { ...base, leftIcon },
    'left-icon-no-slot': { ...base, leftIcon },
    'left-slot-no-icon': { ...base, leftIcon: null },
    'left-icon-style': { ...base, leftIcon, selectedItem: 'Apple' },
    'bottom-content-multi': multi,
    'long-list-open': { ...base, allItems: many },
    'long-list-pick-last': { ...base, allItems: many },
    'long-item-text': {
      ...base,
      selectedItem: 'A rather long fruit description that cannot fit in one line',
      showSelectedItemInDropdown: true,
      allItems: [
        'A rather long fruit description that cannot fit in one line',
        'Another equally long fruit description that wraps inside the list',
        'Short'
      ]
    },
    'test-ids-default': noIds,
    'themed-multi-open': { ...multi, ...two, showSelectedItemCount: true },
    'themed-long-list': {
      ...base,
      allItems: many,
      selectedItem: 'Item 3',
      showSelectedItemInDropdown: true
    },
    'themed-closed': { ...base, selectedItem: 'Banana' },
    'themed-open': { ...base, selectedItem: 'Banana', showSelectedItemInDropdown: true },
    'style-props': { ...base, selectedItem: 'Banana' },
    'style-props-open': { ...base, selectedItem: 'Banana', showSelectedItemInDropdown: true }
  };

  let props = { ...(variants[name] ?? base) };
  $: note('selectedItem', props.selectedItem);
</script>

{#if name === 'default'}
  <Select
    on:message={log('message')}
    on:dropdownClick={log('dropdownClick')}
    on:keydown={log('keydown')}
  />
{:else if name === 'left-icon' || name === 'left-slot-no-icon'}
  <div class="frame">
    <Select
      bind:properties={props}
      on:message={log('message')}
      on:dropdownClick={log('dropdownClick')}
      on:keydown={log('keydown')}
    >
      <span slot="leftContent" class="left">Left</span>
    </Select>
  </div>
{:else if name === 'left-icon-style'}
  <div class="frame icon-theme">
    <Select
      bind:properties={props}
      on:message={log('message')}
      on:dropdownClick={log('dropdownClick')}
      on:keydown={log('keydown')}
    >
      <span slot="leftContent" class="left">Left</span>
    </Select>
  </div>
{:else if name === 'bottom-content-open' || name === 'bottom-content-closed' || name === 'bottom-content-multi'}
  <div class="frame">
    <Select
      bind:properties={props}
      on:message={log('message')}
      on:dropdownClick={log('dropdownClick')}
      on:keydown={log('keydown')}
    >
      <div slot="bottomContent" class="bottom">Need help choosing?</div>
    </Select>
  </div>
{:else if name === 'long-item-text'}
  <div class="frame" style="width: 200px;">
    <Select
      bind:properties={props}
      on:message={log('message')}
      on:dropdownClick={log('dropdownClick')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'themed-closed' || name === 'themed-open' || name === 'themed-multi-open' || name === 'themed-long-list'}
  <div class="frame themed">
    <Select
      bind:properties={props}
      on:message={log('message')}
      on:dropdownClick={log('dropdownClick')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'style-props' || name === 'style-props-open'}
  <div class="frame">
    <Select
      bind:properties={props}
      on:message={log('message')}
      on:dropdownClick={log('dropdownClick')}
      on:keydown={log('keydown')}
      --select-border="2px dashed #b91c1c"
      --select-radius="12px"
      --select-width="300px"
      --selected-item-background-color="#fef3c7"
      --selected-item-padding="14px 20px"
      --item-padding="12px 20px"
      --non-select-font-weight="700"
      --label-text-color="#b91c1c"
      --selected-item-count-bg-color="#b91c1c"
    />
  </div>
{:else}
  <div class="frame">
    <Select
      bind:properties={props}
      dropDownIconAlt={name === 'icon-alt' ? 'chevron' : ''}
      on:message={log('message')}
      on:dropdownClick={log('dropdownClick')}
      on:keydown={log('keydown')}
    />
    <p class="below">Content below the select</p>
  </div>
{/if}

<style>
  .frame {
    width: 360px;
    min-height: 360px;
  }
  .left {
    margin-right: 8px;
    color: #1d4ed8;
  }
  .bottom {
    padding: 8px 16px;
    font-size: 12px;
    color: #6b7280;
  }
  .below {
    margin-top: 220px;
    font-size: 12px;
  }
  .icon-theme {
    --select-icon-height: 32px;
    --select-icon-container-background: #e0f2fe;
    --select-icon-container-border-radius: 8px;
    --select-icon-container-padding: 4px;
    --select-icon-container-margin: 0px 12px 0px 0px;
  }
  .themed {
    --select-border: 2px solid #1d4ed8;
    --select-radius: 10px;
    --select-width: 320px;
    --select-font-size: 16px;
    --select-bgcolor: #eff6ff;
    --select-color: #1e3a8a;
    --selected-item-background-color: #dbeafe;
    --selected-item-padding: 16px 24px;
    --item-padding: 12px 24px;
    --item-background-color: #f8fafc;
    --non-select-font-weight: 700;
    --non-selected-hover-bg: #fde68a;
    --non-selected-item-bgcolor: #f1f5f9;
    --non-selected-max-height: 100px;
    --selected-option-icon: '*';
    --item-selected-icon-color: #b91c1c;
    --label-text-color: #1d4ed8;
    --label-text-size: 14px;
    --label-text-weight: 700;
    --selected-item-count-bg-color: #1d4ed8;
    --selected-item-count-border-radius: 50%;
    --dropdown-arrow-icon-height: 24px;
    --dropdown-arrow-icon-width: 24px;
    --apply-btn-container-background-color: #fef3c7;
    --select-all-btn-padding: 14px 24px;
  }
</style>
