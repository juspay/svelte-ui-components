<svelte:options
  customElement={{
    tag: 'sui-stepper',
    shadow: 'open',
    props: {
      steps: { type: 'Object' },
      currentStepIndex: { type: 'Number', reflect: true, attribute: 'current-step-index' },
      orientation: { type: 'String', reflect: true },
      classes: { type: 'String' },
      testId: { type: 'String', attribute: 'test-id' },
      onstepclick: { type: 'Object' },
      onhandleStepClick: { type: 'Object' },
      suppressRoleAndTabindex: { type: 'Boolean', attribute: 'suppress-role-and-tabindex' },
      suppressContainerTestId: { type: 'Boolean', attribute: 'suppress-container-test-id' },
      onStepClick: { type: 'Object' },
      onHandleStepClick: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Stepper from '$lib/Stepper/Stepper.svelte';
  let props = $props();
</script>

<Stepper {...props} />
