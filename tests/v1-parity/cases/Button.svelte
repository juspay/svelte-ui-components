<script context="module">
  export const cases = [
    { name: 'default' },
    { name: 'text' },
    { name: 'disabled' },
    { name: 'circular-loader' },
    { name: 'progress-loader-idle' },
    { name: 'progress-bar-running' },
    { name: 'icon-slot' },
    { name: 'themed' },
    { name: 'style-props' },
    { name: 'hover', actions: [['hover', 'button']] },
    { name: 'focus', actions: [['focus', 'button']] },
    { name: 'click', actions: [['click', 'button']] },
    { name: 'click-disabled', actions: [['click', 'button', { force: true }]] },
    {
      name: 'click-progress',
      actions: [
        ['click', 'button'],
        ['click', 'button', { force: true }]
      ]
    },
    { name: 'long-text-narrow' }
  ];
</script>

<script>
  import { Button, defaultButtonProperties } from 'sui-v1-under-test';
  import { log, png } from './_kit.js';
  export let name;
  const base = { ...defaultButtonProperties, text: 'Pay now', type: 'button', testId: 'pay' };
</script>

{#if name === 'default'}
  <Button on:click={log('click')} />
{:else if name === 'text'}
  <Button properties={base} on:click={log('click')} />
{:else if name === 'disabled'}
  <Button properties={{ ...base, enable: false }} on:click={log('click')} />
{:else if name === 'circular-loader'}
  <div class="loader-theme">
    <Button
      properties={{ ...base, showLoader: true, loaderType: 'Circular' }}
      on:click={log('click')}
    />
  </div>
{:else if name === 'progress-loader-idle'}
  <Button
    properties={{ ...base, showLoader: true, loaderType: 'ProgressBar' }}
    on:click={log('click')}
  />
{:else if name === 'progress-bar-running'}
  <Button properties={base} showProgressBar={true} on:click={log('click')} />
{:else if name === 'icon-slot'}
  <Button properties={base} on:click={log('click')}>
    <img slot="icon" src={png} alt="" width="16" height="16" />
  </Button>
{:else if name === 'themed'}
  <div class="themed">
    <Button properties={base} on:click={log('click')} />
  </div>
{:else if name === 'style-props'}
  <Button
    properties={base}
    on:click={log('click')}
    --button-border-radius="8px"
    --button-color="#0b6b3a"
    --button-width="100%"
    --button-padding="12px"
  />
{:else if name === 'hover' || name === 'focus' || name === 'click'}
  <div class="hover-theme">
    <Button properties={base} on:click={log('click')} />
  </div>
{:else if name === 'click-disabled'}
  <Button properties={{ ...base, enable: false }} on:click={log('click')} />
{:else if name === 'click-progress'}
  <Button
    properties={{ ...base, loaderType: 'ProgressBar' }}
    showProgressBar={false}
    on:click={log('click')}
  />
{:else if name === 'long-text-narrow'}
  <div style="width: 120px;">
    <Button
      properties={{ ...base, text: 'Proceed to pay the full outstanding amount now' }}
      --button-width="100%"
    />
  </div>
{/if}

<style>
  .themed {
    --button-color: #1d4ed8;
    --button-text-color: #fef3c7;
    --button-border-radius: 24px;
    --button-font-size: 18px;
    --button-height: 56px;
    --button-border: 2px solid #111827;
  }
  .hover-theme {
    --button-hover-color: #7c2d12;
    --button-hover-text-color: #fde68a;
  }
  .loader-theme {
    --loader-foreground: #ffffff;
    --loader-background: #3a4550;
    --loader-foreground-end: #3a4550;
  }
</style>
