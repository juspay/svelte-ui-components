<script context="module">
  export const cases = [
    { name: 'default-with-icon' },
    { name: 'text-only' },
    { name: 'text-and-description' },
    { name: 'description-html' },
    { name: 'description-empty' },
    { name: 'empty-text' },
    { name: 'long-text' },
    { name: 'button-null' },
    { name: 'button' },
    { name: 'button-disabled' },
    { name: 'button-loader' },
    { name: 'button-click', actions: [['click', 'button']] },
    { name: 'button-click-disabled', actions: [['click', 'button', { force: true }]] },
    { name: 'button-hover', actions: [['hover', 'button']] },
    { name: 'button-focus', actions: [['focus', 'button']] },
    { name: 'themed' },
    { name: 'themed-button' },
    { name: 'style-props' },
    { name: 'font-weight-vars' }
  ];
</script>

<script>
  import { Status, defaultStatusProperties } from 'sui-v1-under-test';
  import { log, svg } from './_kit.js';
  export let name;

  const base = {
    ...defaultStatusProperties,
    statusIcon: svg,
    statusText: 'Payment successful',
    statusDescription: 'Your order has been placed.'
  };
  const btn = {
    text: 'Back to shop',
    enable: true,
    showLoader: false,
    loaderType: null,
    type: 'button'
  };
</script>

{#if name === 'default-with-icon'}
  <Status
    properties={{ ...defaultStatusProperties, statusIcon: svg }}
    on:buttonClick={log('buttonClick')}
  />
{:else if name === 'text-only'}
  <Status properties={{ ...base, statusDescription: '' }} on:buttonClick={log('buttonClick')} />
{:else if name === 'text-and-description'}
  <Status properties={base} on:buttonClick={log('buttonClick')} />
{:else if name === 'description-html'}
  <Status
    properties={{
      ...base,
      statusDescription:
        'Order <b>#1234</b> confirmed.<br />Receipt sent to <i>you@example.com</i>.'
    }}
    on:buttonClick={log('buttonClick')}
  />
{:else if name === 'description-empty'}
  <Status properties={{ ...base, statusDescription: '' }} on:buttonClick={log('buttonClick')} />
{:else if name === 'empty-text'}
  <Status
    properties={{ ...base, statusText: '', statusDescription: '' }}
    on:buttonClick={log('buttonClick')}
  />
{:else if name === 'long-text'}
  <Status
    properties={{
      ...base,
      statusText: 'We could not process your payment because the issuing bank declined the request',
      statusDescription:
        'Please check the card details and the available balance, then try again in a few minutes or use another payment method.'
    }}
    on:buttonClick={log('buttonClick')}
  />
{:else if name === 'button-null'}
  <Status properties={{ ...base, buttonProperties: null }} on:buttonClick={log('buttonClick')} />
{:else if name === 'button' || name === 'button-click' || name === 'button-hover' || name === 'button-focus'}
  <Status properties={{ ...base, buttonProperties: btn }} on:buttonClick={log('buttonClick')} />
{:else if name === 'button-disabled' || name === 'button-click-disabled'}
  <Status
    properties={{ ...base, buttonProperties: { ...btn, enable: false } }}
    on:buttonClick={log('buttonClick')}
  />
{:else if name === 'button-loader'}
  <Status
    properties={{ ...base, buttonProperties: { ...btn, showLoader: true, loaderType: 'Circular' } }}
    on:buttonClick={log('buttonClick')}
  />
{:else if name === 'themed'}
  <div class="themed">
    <Status properties={base} on:buttonClick={log('buttonClick')} />
  </div>
{:else if name === 'themed-button'}
  <div class="themed">
    <Status properties={{ ...base, buttonProperties: btn }} on:buttonClick={log('buttonClick')} />
  </div>
{:else if name === 'style-props'}
  <Status
    properties={{ ...base, buttonProperties: btn }}
    on:buttonClick={log('buttonClick')}
    --order-font="monospace"
    --order-font-size="18px"
    --status-description-font-color="#b91c1c"
    --status-font-weight="800"
  />
{:else if name === 'font-weight-vars'}
  <div class="weights">
    <Status properties={base} on:buttonClick={log('buttonClick')} />
  </div>
{/if}

<style>
  .themed {
    --order-font: Georgia, serif;
    --order-font-size: 20px;
    --status-description-font-color: #1d4ed8;
    --status-font-weight: 700;
    --button-color: #1d4ed8;
    --button-text-color: #ffffff;
  }
  .weights {
    --status-font-weight: 300;
    --status-description-font-color: #047857;
  }
</style>
