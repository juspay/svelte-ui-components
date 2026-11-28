<script context="module">
  export const cases = [
    { name: 'default' },
    { name: 'checked' },
    { name: 'unchecked' },
    { name: 'text-set' },
    { name: 'text-set-checked' },
    { name: 'text-empty' },
    { name: 'text-long' },
    { name: 'bound-unchecked' },
    { name: 'bound-checked' },
    { name: 'click-switch', actions: [['click', '.slider']] },
    {
      name: 'click-switch-twice',
      actions: [
        ['click', '.slider'],
        ['click', '.slider']
      ]
    },
    { name: 'click-switch-when-checked', actions: [['click', '.slider']] },
    { name: 'click-switch-no-text', actions: [['click', '.slider']] },
    { name: 'click-label-text', actions: [['click', '.text']] },
    { name: 'focus-unchecked', actions: [['focus', 'input.input-checkbox']] },
    { name: 'focus-checked', actions: [['focus', 'input.input-checkbox']] },
    {
      name: 'keyboard-space',
      actions: [
        ['focus', 'input.input-checkbox'],
        ['key', ' ']
      ]
    },
    { name: 'hover-slider', actions: [['hover', '.slider']] },
    { name: 'css-colors' },
    { name: 'css-colors-unchecked' },
    { name: 'css-size' },
    { name: 'css-square-slider' },
    { name: 'css-text-vars' },
    { name: 'css-text-order-after' },
    { name: 'css-container-vars' },
    { name: 'css-transition-none-click', actions: [['click', '.slider']] },
    { name: 'style-props' }
  ];
</script>

<script>
  import { Toggle } from 'sui-v1-under-test';
  import { log, note } from './_kit.js';
  export let name;
  let value = name === 'bound-checked' || name === 'click-switch-when-checked';
  $: note('checked', value);
</script>

{#if name === 'default'}
  <div style="width: 360px;">
    <Toggle on:click={log('click')} />
  </div>
{:else if name === 'checked'}
  <div style="width: 360px;">
    <Toggle checked={true} on:click={log('click')} />
  </div>
{:else if name === 'unchecked'}
  <div style="width: 360px;">
    <Toggle checked={false} on:click={log('click')} />
  </div>
{:else if name === 'text-set'}
  <div style="width: 360px;">
    <Toggle text="Notifications" on:click={log('click')} />
  </div>
{:else if name === 'text-set-checked'}
  <div style="width: 360px;">
    <Toggle text="Notifications" checked={true} on:click={log('click')} />
  </div>
{:else if name === 'text-empty'}
  <div style="width: 360px;">
    <Toggle text="" on:click={log('click')} />
  </div>
{:else if name === 'text-long'}
  <div style="width: 260px;">
    <Toggle
      text="Receive an email whenever a payment succeeds, fails or is refunded"
      on:click={log('click')}
    />
  </div>
{:else if name === 'bound-unchecked'}
  <div style="width: 360px;">
    <Toggle text="Bound" bind:checked={value} on:click={log('click')} />
  </div>
{:else if name === 'bound-checked'}
  <div style="width: 360px;">
    <Toggle text="Bound" bind:checked={value} on:click={log('click')} />
  </div>
{:else if name === 'click-switch'}
  <div style="width: 360px;">
    <Toggle text="Click me" bind:checked={value} on:click={log('click')} />
  </div>
{:else if name === 'click-switch-twice'}
  <div style="width: 360px;">
    <Toggle text="Click me" bind:checked={value} on:click={log('click')} />
  </div>
{:else if name === 'click-switch-when-checked'}
  <div style="width: 360px;">
    <Toggle text="Click me" bind:checked={value} on:click={log('click')} />
  </div>
{:else if name === 'click-switch-no-text'}
  <div style="width: 360px;">
    <Toggle bind:checked={value} on:click={log('click')} />
  </div>
{:else if name === 'click-label-text'}
  <div style="width: 360px;">
    <Toggle text="Click the text" bind:checked={value} on:click={log('click')} />
  </div>
{:else if name === 'focus-unchecked'}
  <div style="width: 360px;">
    <Toggle text="Focus" on:click={log('click')} />
  </div>
{:else if name === 'focus-checked'}
  <div style="width: 360px;">
    <Toggle text="Focus" checked={true} on:click={log('click')} />
  </div>
{:else if name === 'keyboard-space'}
  <div style="width: 360px;">
    <Toggle text="Space toggles" bind:checked={value} on:click={log('click')} />
  </div>
{:else if name === 'hover-slider'}
  <div style="width: 360px;">
    <Toggle text="Hover" on:click={log('click')} />
  </div>
{:else if name === 'css-colors'}
  <div style="width: 360px;" class="color-theme">
    <Toggle text="Themed" checked={true} on:click={log('click')} />
  </div>
{:else if name === 'css-colors-unchecked'}
  <div style="width: 360px;" class="color-theme">
    <Toggle text="Themed" on:click={log('click')} />
  </div>
{:else if name === 'css-size'}
  <div style="width: 360px;" class="size-theme">
    <Toggle text="Big" checked={true} on:click={log('click')} />
  </div>
{:else if name === 'css-square-slider'}
  <div style="width: 360px;" class="square-theme">
    <Toggle text="Square" checked={true} on:click={log('click')} />
  </div>
{:else if name === 'css-text-vars'}
  <div style="width: 360px;" class="text-theme">
    <Toggle text="Styled text" on:click={log('click')} />
  </div>
{:else if name === 'css-text-order-after'}
  <div style="width: 360px;" class="order-theme">
    <Toggle text="Text after" on:click={log('click')} />
  </div>
{:else if name === 'css-container-vars'}
  <div style="width: 360px;" class="container-theme">
    <Toggle text="Column" on:click={log('click')} />
  </div>
{:else if name === 'css-transition-none-click'}
  <div style="width: 360px;" class="instant-theme">
    <Toggle text="No transition" bind:checked={value} on:click={log('click')} />
  </div>
{:else if name === 'style-props'}
  <div style="width: 360px;">
    <Toggle
      text="Style props"
      checked={true}
      on:click={log('click')}
      --slider-checked-color="#be123c"
      --slider-unchecked-color="#94a3b8"
      --toggle-switch-width="60px"
      --toggle-switch-height="32px"
      --toggle-ball-width="28px"
      --toggle-ball-height="28px"
      --toggle-text-color="#0f172a"
      --toggle-text-font-size="18px"
    />
  </div>
{/if}

<style>
  .color-theme {
    --slider-checked-color: #16a34a;
    --slider-unchecked-color: #fca5a5;
    --toggle-slider-before-background-color: #fef9c3;
    --toggle-text-color: #166534;
    --toggle-text-font-weight: 700;
  }
  .size-theme {
    --toggle-switch-width: 70px;
    --toggle-switch-height: 36px;
    --toggle-ball-width: 32px;
    --toggle-ball-height: 32px;
    --toggle-slider-before-left: 2px;
    --toggle-slider-before-top: 2px;
    --slider-checked-color: #7c3aed;
  }
  .square-theme {
    --slider-border-radius: 4px;
    --slider-border-radius-before: 2px;
  }
  .text-theme {
    --toggle-text-font-size: 20px;
    --toggle-text-font-weight: 700;
    --toggle-text-color: #b45309;
    --toggle-text-margin: 0px 16px 0px 0px;
  }
  .order-theme {
    --toggle-text-order: 2;
    --toggle-container-gap: 20px;
  }
  .container-theme {
    --toggle-container-display: flex;
    --toggle-container-align-items: flex-start;
    --toggle-container-gap: 24px;
  }
  .instant-theme {
    --toggle-slider-transition: 0s;
  }
</style>
