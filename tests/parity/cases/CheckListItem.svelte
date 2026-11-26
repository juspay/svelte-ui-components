<script module>
  const box = '[role="checkbox"]';
  export const cases = [
    { name: 'default' },
    { name: 'checked' },
    { name: 'unchecked-click', actions: [['click', box]] },
    { name: 'checked-click-uncheck', actions: [['click', box]] },
    { name: 'click-text-toggles', actions: [['click', '.text']] },
    {
      name: 'click-twice',
      actions: [
        ['click', box],
        ['click', box]
      ]
    },
    {
      name: 'keyboard-space',
      actions: [
        ['focus', box],
        ['key', 'Space']
      ]
    },
    {
      name: 'keyboard-enter',
      actions: [
        ['focus', box],
        ['key', 'Enter']
      ]
    },
    { name: 'focused', actions: [['focus', box]] },
    { name: 'hover', actions: [['hover', box]] },
    { name: 'disabled' },
    { name: 'disabled-checked' },
    { name: 'disabled-click-does-nothing', actions: [['click', box, { force: true }]] },
    { name: 'long-text-wraps' },
    { name: 'empty-text' },
    { name: 'checkbox-label-snippet' },
    { name: 'checkbox-label-snippet-checked' },
    { name: 'checkbox-label-snippet-click', actions: [['click', box]] },
    { name: 'test-id' },
    { name: 'classes' },
    { name: 'list-of-items' },
    { name: 'list-click-second', actions: [['click', '[data-pw="item-2"] [role="checkbox"]']] },
    { name: 'list-mixed-disabled' },
    { name: 'css-overrides' },
    { name: 'css-overrides-checked' },
    { name: 'css-overrides-disabled' }
  ];
</script>

<script>
  import { CheckListItem } from 'sui-under-test';
  import { log, note } from './_kit.js';
  let { name } = $props();

  const startChecked = new Set([
    'checked',
    'checked-click-uncheck',
    'disabled-checked',
    'checkbox-label-snippet-checked',
    'css-overrides-checked'
  ]);
  let checked = $state(startChecked.has(name));
  let second = $state(false);
  let third = $state(true);
  $effect(() => note('checked', checked));
  $effect(() => note('second', second));
  $effect(() => note('third', third));
  const onclick = log('onclick');
  const onclick2 = log('onclick-2');
  const onclick3 = log('onclick-3');
</script>

<div style="width: 360px; padding: 12px;">
  {#if name === 'default' || name === 'checked' || name === 'unchecked-click' || name === 'checked-click-uncheck' || name === 'click-text-toggles' || name === 'click-twice' || name === 'keyboard-space' || name === 'keyboard-enter' || name === 'focused' || name === 'hover'}
    <CheckListItem bind:checked {onclick} text="Verify business details" />
  {:else if name === 'disabled' || name === 'disabled-checked' || name === 'disabled-click-does-nothing'}
    <CheckListItem bind:checked {onclick} disabled text="Locked step" />
  {:else if name === 'long-text-wraps'}
    <CheckListItem
      bind:checked
      {onclick}
      text="A deliberately long checklist step description that has to wrap onto multiple lines to prove layout and alignment"
    />
  {:else if name === 'empty-text'}
    <CheckListItem bind:checked {onclick} text="" />
  {:else if name === 'checkbox-label-snippet' || name === 'checkbox-label-snippet-checked' || name === 'checkbox-label-snippet-click'}
    <CheckListItem bind:checked {onclick} text="Fallback text">
      {#snippet checkboxLabel()}<strong>Required business details</strong>
        <em style="color: #c5120a"> Required</em>{/snippet}
    </CheckListItem>
  {:else if name === 'test-id'}
    <CheckListItem bind:checked {onclick} testId="item" text="With test id" />
  {:else if name === 'classes'}
    <CheckListItem bind:checked {onclick} classes="extra-class" text="Classes" />
  {:else if name === 'list-of-items' || name === 'list-click-second' || name === 'list-mixed-disabled'}
    <CheckListItem bind:checked testId="item-1" {onclick} text="First step" />
    <CheckListItem bind:checked={second} testId="item-2" onclick={onclick2} text="Second step" />
    <CheckListItem
      bind:checked={third}
      testId="item-3"
      onclick={onclick3}
      disabled={name === 'list-mixed-disabled'}
      text="Third step"
    />
  {:else if name === 'css-overrides' || name === 'css-overrides-checked'}
    <div
      style="--check-list-item-gap: 20px; --check-list-item-padding: 10px 16px; --check-list-item-text-size: 18px; --check-list-item-text-color: #7c2d12; --check-list-item-checked-text-color: #15803d; --check-list-item-checked-font-weight: 700; --check-list-item-width: 280px;"
    >
      <CheckListItem bind:checked {onclick} text="Styled step" />
    </div>
  {:else if name === 'css-overrides-disabled'}
    <div style="--check-list-item-disabled-opacity: 0.8; --check-list-item-gap: 4px;">
      <CheckListItem bind:checked {onclick} disabled text="Styled disabled" />
    </div>
  {/if}
</div>
