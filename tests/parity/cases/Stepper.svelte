<script module>
  const wait = ['wait', 600];
  export const cases = [
    { name: 'horizontal-first-active' },
    { name: 'horizontal-middle-active' },
    { name: 'horizontal-last-active' },
    { name: 'all-completed-index-past-end' },
    { name: 'all-pending-negative-index' },
    { name: 'vertical-middle-active' },
    { name: 'vertical-first-active' },
    { name: 'single-step' },
    { name: 'status-completed-explicit' },
    { name: 'status-active-explicit' },
    { name: 'status-pending-explicit' },
    { name: 'status-failure-explicit' },
    { name: 'status-in-progress-explicit' },
    { name: 'status-muted-explicit' },
    { name: 'all-statuses-horizontal' },
    { name: 'all-statuses-vertical' },
    { name: 'icon-steps' },
    { name: 'icon-overrides-in-progress' },
    { name: 'badge-horizontal' },
    { name: 'badge-vertical' },
    { name: 'long-labels' },
    { name: 'many-steps-wrap' },
    { name: 'click-step-two', actions: [['click', '[data-pw="st-step-2"]']] },
    {
      name: 'keyboard-enter-step',
      actions: [
        ['focus', '[data-pw="st-step-3"]'],
        ['key', 'Enter']
      ]
    },
    {
      name: 'keyboard-space-step',
      actions: [
        ['focus', '[data-pw="st-step-1"]'],
        ['key', ' ']
      ]
    },
    { name: 'focus-step', actions: [['focus', '[data-pw="st-step-2"]']] },
    { name: 'suppress-role-and-tabindex', actions: [['click', '[data-pw="st-step-2"]']] },
    { name: 'test-ids-and-classes' },
    { name: 'suppress-container-test-id' },
    { name: 'step-test-id-override' },
    { name: 'standalone-step-statuses' },
    {
      name: 'standalone-step-aria-label-keydown',
      actions: [
        ['focus', '[data-pw="s"]'],
        ['key', 'a'],
        ['key', 'Enter']
      ]
    },
    { name: 'css-variables-colors' },
    { name: 'css-variables-layout' },
    { name: 'css-variables-separator-and-spinner' }
  ];
</script>

<script>
  import { Stepper, Step } from 'sui-under-test';
  import { log, png, svg } from './_kit.js';
  let { name } = $props();

  const three = [{ label: 'Cart' }, { label: 'Address' }, { label: 'Payment' }];
  const click = log('onhandlestepclick');
  const longLabels = [
    { label: 'A rather long step label that wraps' },
    { label: 'Another long label for the next step' },
    { label: 'Done' }
  ];
</script>

<div style="padding: 8px; font-family: sans-serif; --step-spinner-animation-duration: 100000s;">
  {#if name === 'horizontal-first-active'}
    <Stepper steps={three} currentStepIndex={0} />
  {:else if name === 'horizontal-middle-active'}
    <Stepper steps={three} currentStepIndex={1} />
  {:else if name === 'horizontal-last-active'}
    <Stepper steps={three} currentStepIndex={2} />
  {:else if name === 'all-completed-index-past-end'}
    <Stepper steps={three} currentStepIndex={3} />
  {:else if name === 'all-pending-negative-index'}
    <Stepper steps={three} currentStepIndex={-1} />
  {:else if name === 'vertical-middle-active'}
    <Stepper steps={three} currentStepIndex={1} orientation="vertical" />
  {:else if name === 'vertical-first-active'}
    <Stepper steps={three} currentStepIndex={0} orientation="vertical" />
  {:else if name === 'single-step'}
    <Stepper steps={[{ label: 'Only' }]} currentStepIndex={0} />
  {:else if name === 'status-completed-explicit'}
    <Stepper steps={[{ label: 'A', status: 'completed' }, { label: 'B' }]} currentStepIndex={-1} />
  {:else if name === 'status-active-explicit'}
    <Stepper steps={[{ label: 'A', status: 'active' }, { label: 'B' }]} currentStepIndex={-1} />
  {:else if name === 'status-pending-explicit'}
    <Stepper steps={[{ label: 'A', status: 'pending' }, { label: 'B' }]} currentStepIndex={5} />
  {:else if name === 'status-failure-explicit'}
    <Stepper
      steps={[{ label: 'A' }, { label: 'B', status: 'failure' }, { label: 'C' }]}
      currentStepIndex={1}
    />
  {:else if name === 'status-in-progress-explicit'}
    <Stepper
      steps={[{ label: 'A' }, { label: 'B', status: 'in-progress' }, { label: 'C' }]}
      currentStepIndex={1}
    />
  {:else if name === 'status-muted-explicit'}
    <Stepper
      steps={[{ label: 'A' }, { label: 'B', status: 'muted' }, { label: 'C' }]}
      currentStepIndex={0}
    />
  {:else if name === 'all-statuses-horizontal'}
    <Stepper
      currentStepIndex={0}
      steps={[
        { label: 'Done', status: 'completed' },
        { label: 'Now', status: 'active' },
        { label: 'Later', status: 'pending' },
        { label: 'Bad', status: 'failure' },
        { label: 'Busy', status: 'in-progress' },
        { label: 'Aux', status: 'muted' }
      ]}
    />
  {:else if name === 'all-statuses-vertical'}
    <Stepper
      orientation="vertical"
      currentStepIndex={0}
      steps={[
        { label: 'Done', status: 'completed' },
        { label: 'Now', status: 'active' },
        { label: 'Later', status: 'pending' },
        { label: 'Bad', status: 'failure' },
        { label: 'Busy', status: 'in-progress' },
        { label: 'Aux', status: 'muted' }
      ]}
    />
  {:else if name === 'icon-steps'}
    <Stepper
      currentStepIndex={1}
      steps={[{ label: 'One', icon: png }, { label: 'Two', icon: svg }, { label: 'Three' }]}
    />
  {:else if name === 'icon-overrides-in-progress'}
    <Stepper
      currentStepIndex={0}
      steps={[{ label: 'Busy with icon', icon: svg, status: 'in-progress' }, { label: 'Next' }]}
    />
  {:else if name === 'badge-horizontal'}
    {#snippet badge()}<span
        style="background: #fde68a; padding: 0 6px; border-radius: 8px; font-size: 10px;">New</span
      >{/snippet}
    <Stepper
      currentStepIndex={1}
      steps={[{ label: 'One', badge }, { label: 'Two', badge }, { label: 'Three' }]}
    />
  {:else if name === 'badge-vertical'}
    {#snippet badge()}<span
        style="background: #fde68a; padding: 0 6px; border-radius: 8px; font-size: 10px;">New</span
      >{/snippet}
    <Stepper
      orientation="vertical"
      currentStepIndex={1}
      steps={[{ label: 'One', badge }, { label: 'Two' }, { label: 'Three', badge }]}
    />
  {:else if name === 'long-labels'}
    <div style="width: 360px;">
      <Stepper steps={longLabels} currentStepIndex={1} />
    </div>
  {:else if name === 'many-steps-wrap'}
    <div
      style="width: 360px; --container-flex-wrap: wrap; --stepper-separator-width: 12px; --stepper-separator-margin: 0 4px;"
    >
      <Stepper
        currentStepIndex={3}
        steps={[
          { label: 'One' },
          { label: 'Two' },
          { label: 'Three' },
          { label: 'Four' },
          { label: 'Five' },
          { label: 'Six' },
          { label: 'Seven' },
          { label: 'Eight' }
        ]}
      />
    </div>
  {:else if name === 'click-step-two'}
    <Stepper steps={three} currentStepIndex={0} testId="st" onhandlestepclick={click} />
  {:else if name === 'keyboard-enter-step' || name === 'keyboard-space-step'}
    <Stepper steps={three} currentStepIndex={0} testId="st" onhandlestepclick={click} />
  {:else if name === 'focus-step'}
    <Stepper steps={three} currentStepIndex={1} testId="st" />
  {:else if name === 'suppress-role-and-tabindex'}
    <Stepper
      steps={three}
      currentStepIndex={1}
      testId="st"
      suppressRoleAndTabindex
      onhandlestepclick={click}
    />
  {:else if name === 'test-ids-and-classes'}
    <Stepper steps={three} currentStepIndex={1} testId="st" classes="extra-class" />
  {:else if name === 'suppress-container-test-id'}
    <Stepper steps={three} currentStepIndex={1} testId="st" suppressContainerTestId />
  {:else if name === 'step-test-id-override'}
    <Stepper
      steps={[{ label: 'A', testId: 'custom-a' }, { label: 'B' }]}
      currentStepIndex={0}
      testId="st"
    />
  {:else if name === 'standalone-step-statuses'}
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <Step stepIndex={1} label="Completed" status="completed" />
      <Step stepIndex={2} label="Active" status="active" />
      <Step stepIndex={3} label="Pending" status="pending" />
      <Step stepIndex={4} label="Failure" status="failure" />
      <Step stepIndex={5} label="In progress" status="in-progress" />
      <Step stepIndex={6} label="Muted" status="muted" />
      <Step stepIndex={7} label="Vertical" status="active" orientation="vertical" />
    </div>
  {:else if name === 'standalone-step-aria-label-keydown'}
    <Step
      stepIndex={2}
      label="Cart"
      status="active"
      testId="s"
      ariaLabel="Step 2 - Cart (current)"
      onclick={log('onclick')}
      onkeydown={log('onkeydown')}
    />
  {:else if name === 'css-variables-colors'}
    <div
      style="--step-text-completed-color: #0f766e; --step-text-active-color: #1d4ed8; --step-text-pending-color: #6b7280; --step-index-container-completed-background-color: #0f766e; --step-index-container-active-background-color: #1d4ed8; --step-index-container-pending-background-color: #9ca3af; --stepper-separator-background-image-completed-color: #0f766e; --stepper-separator-background-image-pending-color: #9ca3af; --step-index-container-active-border: 2px solid #93c5fd; --step-text-font-weight: 700;"
    >
      <Stepper steps={three} currentStepIndex={1} />
    </div>
  {:else if name === 'css-variables-layout'}
    <div
      style="--step-index-container-height: 40px; --step-index-container-width: 40px; --step-index-container-radius: 8px; --step-index-font-size: 18px; --step-text-font-size: 16px; --step-text-margin: 0 0 0 16px; --stepper-separator-width: 24px; --stepper-separator-margin: 0 6px; --step-icon-size: 24px;"
    >
      <Stepper
        steps={[{ label: 'One', icon: svg }, { label: 'Two' }, { label: 'Three' }]}
        currentStepIndex={1}
      />
    </div>
  {:else if name === 'css-variables-separator-and-spinner'}
    <div
      style="--stepper-separator-vertical-height: 20px; --stepper-separator-vertical-margin: 2px 0 2px 10px; --step-spinner-size: 26px; --step-text-vertical-margin: 4px 0 0 0; --stepper-status-in-progress-color: #7c3aed; --stepper-status-failure-color: #be123c;"
    >
      <Stepper
        orientation="vertical"
        currentStepIndex={0}
        steps={[
          { label: 'Busy', status: 'in-progress' },
          { label: 'Failed', status: 'failure' },
          { label: 'Rest' }
        ]}
      />
    </div>
  {/if}
</div>
