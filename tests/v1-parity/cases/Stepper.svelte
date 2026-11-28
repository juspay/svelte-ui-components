<script context="module">
  const step = (n) => ['click', `.step-container:nth-child(${n}) .step`];

  export const cases = [
    { name: 'index-first' },
    { name: 'index-middle' },
    { name: 'index-last' },
    { name: 'index-beyond-last' },
    { name: 'index-negative' },
    { name: 'index-second-of-two' },
    { name: 'no-steps', allowBlank: true },
    { name: 'one-step' },
    { name: 'all-icons' },
    { name: 'mixed-icons' },
    { name: 'icons-completed-active' },
    { name: 'long-labels' },
    { name: 'click-first', actions: [step(1)] },
    { name: 'click-middle', actions: [step(3)] },
    { name: 'click-last', actions: [step(5)] },
    { name: 'click-icon-step', actions: [step(2)] },
    { name: 'click-each-step', actions: [step(1), step(2), step(3), step(4), step(5)] },
    { name: 'focus-step', actions: [['focus', '.step-container:nth-child(2) .step']] },
    { name: 'hover-step', actions: [['hover', '.step-container:nth-child(2) .step']] },
    { name: 'themed' },
    { name: 'themed-icons' },
    { name: 'vertical' },
    { name: 'style-props' },
    { name: 'custom-separator' }
  ];
</script>

<script>
  import { Stepper } from 'sui-v1-under-test';
  import { log, note, png, svg } from './_kit.js';
  export let name;

  const plain = [
    { label: 'Cart' },
    { label: 'Address' },
    { label: 'Shipping' },
    { label: 'Payment' },
    { label: 'Done' }
  ];
  const mixed = [
    { label: 'Cart', icon: png },
    { label: 'Address' },
    { label: 'Shipping', icon: svg },
    { label: 'Payment' },
    { label: 'Done', icon: png }
  ];
  const allIcons = plain.map((s, i) => ({ ...s, icon: i % 2 ? svg : png }));
  const longLabels = [
    { label: 'Review the items in your shopping cart' },
    { label: 'Enter a delivery address' },
    { label: 'Pick a shipping speed' }
  ];

  const variants = {
    'index-first': { steps: plain, currentStepIndex: 0 },
    'index-middle': { steps: plain, currentStepIndex: 2 },
    'index-last': { steps: plain, currentStepIndex: 4 },
    'index-beyond-last': { steps: plain, currentStepIndex: 9 },
    'index-negative': { steps: plain, currentStepIndex: -1 },
    'index-second-of-two': { steps: plain.slice(0, 2), currentStepIndex: 1 },
    'no-steps': { steps: [], currentStepIndex: 0 },
    'one-step': { steps: plain.slice(0, 1), currentStepIndex: 0 },
    'all-icons': { steps: allIcons, currentStepIndex: 2 },
    'mixed-icons': { steps: mixed, currentStepIndex: 2 },
    'icons-completed-active': { steps: mixed, currentStepIndex: 3 },
    'long-labels': { steps: longLabels, currentStepIndex: 1 },
    'themed-icons': { steps: mixed, currentStepIndex: 2 }
  };
  let props = { ...(variants[name] ?? { steps: plain, currentStepIndex: 2 }) };
  $: note('currentStepIndex', props.currentStepIndex);
</script>

{#if name === 'themed' || name === 'themed-icons'}
  <div class="themed">
    <Stepper bind:properties={props} on:handleStepClick={log('handleStepClick')} />
  </div>
{:else if name === 'vertical'}
  <div class="vertical">
    <Stepper bind:properties={props} on:handleStepClick={log('handleStepClick')} />
  </div>
{:else if name === 'custom-separator'}
  <div class="separator-theme">
    <Stepper bind:properties={props} on:handleStepClick={log('handleStepClick')} />
  </div>
{:else if name === 'style-props'}
  <Stepper
    bind:properties={props}
    on:handleStepClick={log('handleStepClick')}
    --step-text-active-color="#7c2d12"
    --step-text-completed-color="#1d4ed8"
    --step-index-container-active-background-color="#7c2d12"
    --step-index-container-completed-background-color="#1d4ed8"
    --separator-background-image-active-color="#7c2d12"
    --separator-background-image-completed-color="#1d4ed8"
    --step-index-container-height="40px"
    --step-index-container-width="40px"
    --step-index-container-radius="8px"
    --separator-width="20px"
  />
{:else}
  <Stepper bind:properties={props} on:handleStepClick={log('handleStepClick')} />
{/if}

<style>
  .themed {
    --step-text-active-color: #7c2d12;
    --step-text-completed-color: #1d4ed8;
    --step-text-color: #9ca3af;
    --step-text-font-size: 14px;
    --step-text-margin: 0px 0px 0px 6px;
    --step-index-container-active-background-color: #7c2d12;
    --step-index-container-completed-background-color: #1d4ed8;
    --step-index-container-height: 36px;
    --step-index-container-width: 36px;
    --step-index-container-radius: 6px;
    --step-index-font-size: 18px;
    --step-index-color: #fef3c7;
    --separator-width: 24px;
    --separator-height: 3px;
    --separator-margin: 0px 6px 0px 6px;
    --separator-background-image-active-color: #7c2d12;
    --separator-background-image-completed-color: #1d4ed8;
  }
  .vertical {
    --container-flex-direction: column;
    --step-flex-direction: row;
    --separator-width: 30px;
  }
  .separator-theme {
    --separator-display: block;
    --separator-background-image: linear-gradient(to right, #111827, #111827);
    --separator-height: 4px;
    --step-flex-direction: column;
    --step-text-margin: 6px 0px 0px 0px;
  }
</style>
