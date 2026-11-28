<script context="module">
  export const cases = [
    { name: 'default' },
    { name: 'text-plain' },
    { name: 'text-plain-checked' },
    { name: 'text-html' },
    { name: 'text-html-checked' },
    { name: 'text-empty' },
    { name: 'text-long-wraps' },
    { name: 'unchecked' },
    { name: 'checked' },
    { name: 'bound-unchecked' },
    { name: 'bound-checked' },
    { name: 'label-slot' },
    { name: 'label-slot-checked' },
    { name: 'label-slot-with-image' },
    { name: 'click-checkbox', actions: [['click', 'input.checkbox']] },
    {
      name: 'click-checkbox-twice',
      actions: [
        ['click', 'input.checkbox'],
        ['click', 'input.checkbox']
      ]
    },
    { name: 'click-checkbox-when-checked', actions: [['click', 'input.checkbox']] },
    { name: 'click-text', actions: [['click', '.text']] },
    { name: 'click-slot-label', actions: [['click', '.custom']] },
    { name: 'focus-checkbox', actions: [['focus', 'input.checkbox']] },
    {
      name: 'keyboard-space',
      actions: [
        ['focus', 'input.checkbox'],
        ['key', ' ']
      ]
    },
    { name: 'hover-checkbox', actions: [['hover', 'input.checkbox']] },
    { name: 'css-checked-text-vars' },
    { name: 'css-checked-text-vars-unchecked' },
    { name: 'css-checkbox-size' },
    { name: 'css-checkbox-margin-padding' },
    { name: 'css-accent-colour' },
    { name: 'css-container-vars' },
    { name: 'css-checkbox-visibility-hidden' },
    { name: 'style-props' },
    { name: 'narrow-container' },
    { name: 'width-var' }
  ];
</script>

<script>
  import { CheckListItem } from 'sui-v1-under-test';
  import { log, note, png } from './_kit.js';
  export let name;
  const htmlText = 'I agree to the <b>Terms</b> and <i>Privacy</i> <a href="#terms">policy</a>';
  const longText =
    'I confirm that I have read and understood every clause of the agreement and accept all of it';
  let value =
    name === 'bound-checked' ||
    name === 'click-checkbox-when-checked' ||
    name === 'label-slot-checked';
  $: note('checked', value);
</script>

{#if name === 'default'}
  <div style="width: 360px;">
    <CheckListItem text="" checked={false} on:click={log('click')} />
  </div>
{:else if name === 'text-plain'}
  <div style="width: 360px;">
    <CheckListItem text="Accept the terms" checked={false} on:click={log('click')} />
  </div>
{:else if name === 'text-plain-checked'}
  <div style="width: 360px;">
    <CheckListItem text="Accept the terms" checked={true} on:click={log('click')} />
  </div>
{:else if name === 'text-html'}
  <div style="width: 360px;">
    <CheckListItem text={htmlText} checked={false} on:click={log('click')} />
  </div>
{:else if name === 'text-html-checked'}
  <div style="width: 360px;">
    <CheckListItem text={htmlText} checked={true} on:click={log('click')} />
  </div>
{:else if name === 'text-empty'}
  <div style="width: 360px;">
    <CheckListItem text="" checked={false} on:click={log('click')} />
  </div>
{:else if name === 'text-long-wraps'}
  <div style="width: 220px;">
    <CheckListItem text={longText} checked={false} on:click={log('click')} />
  </div>
{:else if name === 'unchecked'}
  <div style="width: 360px;">
    <CheckListItem text="Subscribe to updates" checked={false} on:click={log('click')} />
  </div>
{:else if name === 'checked'}
  <div style="width: 360px;">
    <CheckListItem text="Subscribe to updates" checked={true} on:click={log('click')} />
  </div>
{:else if name === 'bound-unchecked'}
  <div style="width: 360px;">
    <CheckListItem text="Remember me" bind:checked={value} on:click={log('click')} />
    <div id="state">{value}</div>
  </div>
{:else if name === 'bound-checked'}
  <div style="width: 360px;">
    <CheckListItem text="Remember me" bind:checked={value} on:click={log('click')} />
    <div id="state">{value}</div>
  </div>
{:else if name === 'label-slot'}
  <div style="width: 360px;">
    <CheckListItem text="ignored text" checked={false} on:click={log('click')}>
      <span slot="checkboxLabel" class="custom">Custom <b>slot</b> label</span>
    </CheckListItem>
  </div>
{:else if name === 'label-slot-checked'}
  <div style="width: 360px;">
    <CheckListItem text="ignored text" bind:checked={value} on:click={log('click')}>
      <span slot="checkboxLabel" class="custom">Custom slot label ({value ? 'on' : 'off'})</span>
    </CheckListItem>
  </div>
{:else if name === 'label-slot-with-image'}
  <div style="width: 360px;">
    <CheckListItem text="" checked={false} on:click={log('click')}>
      <img slot="checkboxLabel" src={png} alt="" width="20" height="20" style="margin-left: 8px;" />
    </CheckListItem>
  </div>
{:else if name === 'click-checkbox'}
  <div style="width: 360px;">
    <CheckListItem text="Click me" bind:checked={value} on:click={log('click')} />
  </div>
{:else if name === 'click-checkbox-twice'}
  <div style="width: 360px;">
    <CheckListItem text="Click me" bind:checked={value} on:click={log('click')} />
  </div>
{:else if name === 'click-checkbox-when-checked'}
  <div style="width: 360px;">
    <CheckListItem text="Click me" bind:checked={value} on:click={log('click')} />
  </div>
{:else if name === 'click-text'}
  <div style="width: 360px;">
    <CheckListItem text="Click the text" bind:checked={value} on:click={log('click')} />
  </div>
{:else if name === 'click-slot-label'}
  <div style="width: 360px;">
    <CheckListItem text="" bind:checked={value} on:click={log('click')}>
      <span slot="checkboxLabel" class="custom">Click the slot</span>
    </CheckListItem>
  </div>
{:else if name === 'focus-checkbox'}
  <div style="width: 360px;">
    <CheckListItem text="Focus me" checked={false} on:click={log('click')} />
  </div>
{:else if name === 'keyboard-space'}
  <div style="width: 360px;">
    <CheckListItem text="Space toggles" bind:checked={value} on:click={log('click')} />
  </div>
{:else if name === 'hover-checkbox'}
  <div style="width: 360px;">
    <CheckListItem text="Hover me" checked={false} on:click={log('click')} />
  </div>
{:else if name === 'css-checked-text-vars'}
  <div style="width: 360px;" class="checked-theme">
    <CheckListItem text="Accepted" checked={true} on:click={log('click')} />
  </div>
{:else if name === 'css-checked-text-vars-unchecked'}
  <div style="width: 360px;" class="checked-theme">
    <CheckListItem text="Not yet accepted" checked={false} on:click={log('click')} />
  </div>
{:else if name === 'css-checkbox-size'}
  <div style="width: 360px;" class="size-theme">
    <CheckListItem text="Big checkbox" checked={true} on:click={log('click')} />
  </div>
{:else if name === 'css-checkbox-margin-padding'}
  <div style="width: 360px;" class="space-theme">
    <CheckListItem text="Spaced checkbox" checked={false} on:click={log('click')} />
  </div>
{:else if name === 'css-accent-colour'}
  <div style="width: 360px;" class="accent-theme">
    <CheckListItem text="Green accent" checked={true} on:click={log('click')} />
  </div>
{:else if name === 'css-container-vars'}
  <div style="width: 360px;" class="container-theme">
    <CheckListItem text="Container themed" checked={false} on:click={log('click')} />
  </div>
{:else if name === 'css-checkbox-visibility-hidden'}
  <div style="width: 360px;" class="hidden-theme">
    <CheckListItem text="Hidden checkbox" checked={false} on:click={log('click')} />
  </div>
{:else if name === 'style-props'}
  <div style="width: 360px;">
    <CheckListItem
      text="Style props"
      checked={true}
      on:click={log('click')}
      --checkbox-accent-color="#be123c"
      --checkbox-height="32px"
      --checkbox-width="32px"
      --checkbox-margin="0px 4px"
      --check-list-item-margin="0px 0px 0px 16px"
      --check-list-item-text-size="18px"
      --check-list-item-text-color="#334155"
      --check-list-item-checked-text-color="#be123c"
      --check-list-item-checked-font-weight="700"
    />
  </div>
{:else if name === 'narrow-container'}
  <div style="width: 120px;">
    <CheckListItem text="Narrow container width" checked={false} on:click={log('click')} />
  </div>
{:else if name === 'width-var'}
  <div style="width: 360px;" class="width-theme">
    <CheckListItem text="Half width" checked={false} on:click={log('click')} />
  </div>
{/if}

<style>
  .checked-theme {
    --check-list-item-text-size: 16px;
    --check-list-item-text-color: #64748b;
    --check-list-item-checked-text-color: #15803d;
    --check-list-item-checked-font-weight: 700;
  }
  .size-theme {
    --checkbox-height: 40px;
    --checkbox-width: 40px;
  }
  .space-theme {
    --checkbox-margin: 8px 12px;
    --checkbox-padding: 4px;
    --checkbox-border-radius: 8px;
    --check-list-item-margin: 0px 0px 0px 20px;
  }
  .accent-theme {
    --checkbox-accent-color: #16a34a;
  }
  .container-theme {
    --check-list-item-padding: 12px;
    --check-list-item-align-items: flex-start;
    --check-list-item-text-size: 20px;
    --check-list-item-text-color: #7c2d12;
  }
  .hidden-theme {
    --checkbox-visibility: hidden;
  }
  .width-theme {
    --check-list-item-width: 50%;
    --check-list-item-display: flex;
  }
  .custom {
    margin-left: 8px;
    color: #1d4ed8;
    font-size: 14px;
  }
</style>
