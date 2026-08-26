<svelte:options
  customElement={{
    tag: 'sui-thinking-indicator',
    shadow: 'open',
    props: {
      label: { type: 'String', reflect: true },
      detail: { type: 'String' },
      expanded: { type: 'Boolean', reflect: true },
      variant: { type: 'String', reflect: true },
      showElapsed: { type: 'Boolean', attribute: 'show-elapsed' },
      onToggle: { type: 'Object' },
      avatar: { type: 'Object' },
      toggleIcon: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      toggleTestId: { type: 'String', attribute: 'toggle-test-id' },
      detailTestId: { type: 'String', attribute: 'detail-test-id' },
      labelTestId: { type: 'String', attribute: 'label-test-id' },
      classes: { type: 'String' },
      rows: { type: 'Array' },
      kind: { type: 'String', reflect: true },
      busy: { type: 'Boolean', reflect: true },
      query: { type: 'String' },
      moreLabel: { type: 'String', attribute: 'more-label' },
      selectable: { type: 'Boolean' },
      selected: { type: 'Object' },
      onrowselect: { type: 'Object' },
      onsettled: { type: 'Object' },
      collapseDelayMs: { type: 'Object', attribute: 'collapse-delay-ms' }
    }
  }}
/>

<script lang="ts">
  import ThinkingIndicator from '$lib/ThinkingIndicator/ThinkingIndicator.svelte';
  let props = $props();
</script>

<ThinkingIndicator {...props} />
