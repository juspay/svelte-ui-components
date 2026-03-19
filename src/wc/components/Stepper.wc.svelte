<svelte:options
  customElement={{
    tag: 'sui-stepper',
    shadow: 'open',
    props: {
      steps: { type: 'Object' },
      currentStepIndex: { type: 'Number', reflect: true },
      testId: { type: 'String' },
      classes: { type: 'String' },
      onclick: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Stepper from '$lib/Stepper/Stepper.svelte';
  let props = $props();
</script>

<Stepper {...props} />
