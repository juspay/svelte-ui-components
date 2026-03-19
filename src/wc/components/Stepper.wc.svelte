<svelte:options
  customElement={{
    tag: 'sui-stepper',
    shadow: 'open',
    props: {
      steps: { type: 'Object' },
      currentStepIndex: { type: 'Number', reflect: true },
      classes: { type: 'String' },
      onhandleStepClick: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Stepper from '$lib/Stepper/Stepper.svelte';
  let props = $props();
</script>

<Stepper {...props} />
