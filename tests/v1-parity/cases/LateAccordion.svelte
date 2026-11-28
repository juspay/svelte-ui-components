<script context="module">
  // Nimble's delivery row: the estimate arrives after the row has mounted, so `useAccordion` and
  // `expand` both turn true later and the accordion is created with its content already present.
  export const cases = [
    {
      name: 'late-on',
      actions: [
        ['click', '#t'],
        ['wait', 600]
      ]
    },
    {
      name: 'late-on-then-off',
      actions: [
        ['click', '#t'],
        ['wait', 600],
        ['click', '#off'],
        ['wait', 600]
      ]
    },
    {
      name: 'late-on-click-row',
      actions: [
        ['click', '#t'],
        ['wait', 600],
        ['click', '[data-pw="estimated-delivery"]']
      ]
    },
    {
      name: 'late-on-async',
      actions: [
        ['click', '#a'],
        ['wait', 900]
      ]
    },
    {
      name: 'undefined-first',
      actions: [
        ['click', '#t'],
        ['wait', 600]
      ]
    },
    {
      name: 'undefined-first-async',
      actions: [
        ['click', '#a'],
        ['wait', 900]
      ]
    }
  ];
</script>

<script>
  import { ListItem, defaultListItemProperties } from 'sui-v1-under-test';
  import { log, png } from './_kit.js';
  export let name;

  let estimate = name.startsWith('undefined-first') ? undefined : null;
  $: props = {
    ...defaultListItemProperties,
    leftImageUrl: png,
    label: null,
    useAccordion: estimate !== null,
    rightContentText: null
  };
  function later() {
    setTimeout(() => (estimate = 'Delivery by 28 Nov'), 50);
  }
</script>

<button id="t" on:click={() => (estimate = 'Delivery by 28 Nov')}>estimate</button>
<button id="off" on:click={() => (estimate = null)}>clear</button>
<button id="a" on:click={later}>later</button>
<div style="width: 360px;">
  <ListItem properties={props} expand={estimate !== null} on:itemClick={log('itemClick')}>
    <div slot="centerContent">John Wick, Bangalore 560030</div>
    <div slot="bottomContent">
      {#if estimate}
        <div
          data-pw="estimated-delivery"
          role="button"
          tabindex="0"
          style="padding: 10px; background: #e0f2fe;"
          on:click|stopPropagation={log('estimate')}
          on:keydown
        >
          {estimate}
        </div>
      {/if}
    </div>
  </ListItem>
</div>
<p>{name}</p>
