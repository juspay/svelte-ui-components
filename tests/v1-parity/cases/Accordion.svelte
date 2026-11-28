<script context="module">
  export const cases = [
    { name: 'default' },
    { name: 'collapsed-short' },
    { name: 'expanded-short', actions: [['wait', 600]] },
    { name: 'collapsed-long' },
    { name: 'expanded-long', actions: [['wait', 600]] },
    {
      name: 'toggle-open-short',
      actions: [
        ['click', '#t'],
        ['wait', 600]
      ]
    },
    {
      name: 'toggle-open-long',
      actions: [
        ['click', '#t'],
        ['wait', 600]
      ]
    },
    {
      name: 'toggle-open-close',
      actions: [
        ['click', '#t'],
        ['wait', 600],
        ['click', '#t'],
        ['wait', 600]
      ]
    },
    {
      name: 'toggle-close-from-open',
      actions: [
        ['wait', 600],
        ['click', '#t'],
        ['wait', 600]
      ]
    },
    {
      name: 'toggle-three-times',
      actions: [
        ['click', '#t'],
        ['wait', 600],
        ['click', '#t'],
        ['wait', 600],
        ['click', '#t'],
        ['wait', 600]
      ]
    },
    { name: 'expand-prop-static', actions: [['wait', 600]] },
    { name: 'empty-expanded', actions: [['wait', 600]] },
    {
      name: 'between-siblings',
      actions: [
        ['click', '#t'],
        ['wait', 600]
      ]
    },
    {
      name: 'nested-toggle',
      knownDifference:
        '1.34.1 measures the parent while the nested accordion is still opening, so its height varies by machine speed (54, 59, 64 px measured); v1 gives the settled 64 px every time',
      actions: [
        ['click', '#t'],
        ['wait', 600]
      ]
    }
  ];
</script>

<script>
  import { Accordion } from 'sui-v1-under-test';
  import { note, png } from './_kit.js';
  export let name;
  let expand =
    name === 'expanded-short' ||
    name === 'expanded-long' ||
    name === 'toggle-close-from-open' ||
    name === 'empty-expanded';
  $: note('expand', expand);
  const lines = Array.from({ length: 12 }, (_, i) => `Line ${i + 1} of long accordion content`);
</script>

{#if name === 'default'}
  <Accordion />
  <p>after</p>
{:else if name === 'collapsed-short'}
  <button id="t" on:click={() => (expand = !expand)}>toggle</button>
  <Accordion bind:expand>
    <div style="padding: 8px; background: #fde68a">Short content</div>
  </Accordion>
  <p>after</p>
{:else if name === 'expanded-short'}
  <button id="t" on:click={() => (expand = !expand)}>toggle</button>
  <Accordion bind:expand>
    <div style="padding: 8px; background: #fde68a">Short content</div>
  </Accordion>
  <p>after</p>
{:else if name === 'collapsed-long'}
  <button id="t" on:click={() => (expand = !expand)}>toggle</button>
  <Accordion bind:expand>
    {#each lines as line}
      <div style="padding: 4px; background: #bfdbfe">{line}</div>
    {/each}
  </Accordion>
  <p>after</p>
{:else if name === 'expanded-long'}
  <button id="t" on:click={() => (expand = !expand)}>toggle</button>
  <Accordion bind:expand>
    {#each lines as line}
      <div style="padding: 4px; background: #bfdbfe">{line}</div>
    {/each}
  </Accordion>
  <p>after</p>
{:else if name === 'toggle-open-short' || name === 'toggle-open-close' || name === 'toggle-three-times'}
  <button id="t" on:click={() => (expand = !expand)}>toggle</button>
  <Accordion bind:expand>
    <div style="padding: 8px; background: #bbf7d0">Short toggled content</div>
  </Accordion>
  <p>after</p>
{:else if name === 'toggle-open-long'}
  <button id="t" on:click={() => (expand = !expand)}>toggle</button>
  <Accordion bind:expand>
    {#each lines as line}
      <div style="padding: 4px; background: #bbf7d0">{line}</div>
    {/each}
  </Accordion>
  <p>after</p>
{:else if name === 'toggle-close-from-open'}
  <button id="t" on:click={() => (expand = !expand)}>toggle</button>
  <Accordion bind:expand>
    <div style="padding: 8px; background: #fecaca">Starts open then closes</div>
  </Accordion>
  <p>after</p>
{:else if name === 'expand-prop-static'}
  <Accordion expand={true}>
    <div style="padding: 8px; background: #e9d5ff">Static expand prop</div>
  </Accordion>
  <p>after</p>
{:else if name === 'empty-expanded'}
  <button id="t" on:click={() => (expand = !expand)}>toggle</button>
  <Accordion bind:expand />
  <p>after</p>
{:else if name === 'between-siblings'}
  <div style="border: 1px solid #111827">
    <div>Header</div>
    <button id="t" on:click={() => (expand = !expand)}>toggle</button>
    <Accordion bind:expand>
      <img src={png} alt="" width="48" height="48" />
      <div>Body text</div>
    </Accordion>
    <div>Footer</div>
  </div>
{:else if name === 'nested-toggle'}
  <button id="t" on:click={() => (expand = !expand)}>toggle</button>
  <Accordion bind:expand>
    <div style="padding: 8px">Outer</div>
    <Accordion expand={true}>
      <div style="padding: 8px; background: #fde68a">Inner</div>
    </Accordion>
  </Accordion>
  <p>after</p>
{/if}
