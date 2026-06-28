<svelte:options
  customElement={{
    tag: 'sui-proportion-bar',
    shadow: 'open',
    props: {
      segments: { type: 'Object' },
      showLegend: { type: 'Boolean', attribute: 'show-legend' },
      // `valueFormat` is a function and cannot cross the HTML-attribute boundary,
      // so it is exposed as a JS property only (no `attribute` mapping):
      //   document.querySelector('sui-proportion-bar').valueFormat = (v, p) => `${v} (${p}%)`;
      valueFormat: { type: 'Object' },
      trackHeight: { type: 'String', attribute: 'track-height' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import ProportionBar from '$lib/ProportionBar/ProportionBar.svelte';
  let props = $props();
</script>

<ProportionBar {...props} />
