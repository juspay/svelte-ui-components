<script context="module">
  export const cases = [
    {
      name: 'default',
      knownDifference:
        "an image with no source shows Chrome's broken-image icon instead of an empty frame (Svelte 5 builds markup in an inert template document; see docs/V1_COMPAT.md)"
    },
    { name: 'icon-only-png' },
    { name: 'icon-only-svg' },
    { name: 'icon-and-text' },
    {
      name: 'text-only',
      knownDifference:
        "an image with no source shows Chrome's broken-image icon instead of an empty frame (Svelte 5 builds markup in an inert template document; see docs/V1_COMPAT.md)"
    },
    { name: 'text-empty' },
    { name: 'text-long' },
    { name: 'text-html-chars' },
    { name: 'spread-defaults' },
    { name: 'direction-row' },
    { name: 'themed' },
    { name: 'style-props' },
    { name: 'text-direction' },
    { name: 'hover', actions: [['hover', '.icon-container']] },
    { name: 'focus', actions: [['focus', '.icon-container']] },
    { name: 'click', actions: [['click', '.icon-container']] },
    { name: 'click-text', actions: [['click', '.icon-text']] },
    { name: 'click-image', actions: [['click', 'img']] },
    { name: 'keydown-enter', actions: [['press', '.icon-container', 'Enter']] },
    { name: 'keydown-space', actions: [['press', '.icon-container', 'Space']] },
    { name: 'narrow-wrap' },
    { name: 'in-flex-row' }
  ];
</script>

<script>
  import { Icon, defaultIconProperties } from 'sui-v1-under-test';
  import { log, png, svg } from './_kit.js';
  export let name;
</script>

{#if name === 'default'}
  <Icon on:click={log('click')} on:keydown={log('keydown')} />
{:else if name === 'icon-only-png'}
  <Icon properties={{ icon: png, text: '' }} on:click={log('click')} on:keydown={log('keydown')} />
{:else if name === 'icon-only-svg'}
  <Icon properties={{ icon: svg, text: '' }} on:click={log('click')} on:keydown={log('keydown')} />
{:else if name === 'icon-and-text'}
  <Icon
    properties={{ icon: png, text: 'Wallet' }}
    on:click={log('click')}
    on:keydown={log('keydown')}
  />
{:else if name === 'text-only'}
  <Icon
    properties={{ icon: '', text: 'No icon' }}
    on:click={log('click')}
    on:keydown={log('keydown')}
  />
{:else if name === 'text-empty'}
  <Icon properties={{ icon: svg, text: '' }} on:click={log('click')} on:keydown={log('keydown')} />
{:else if name === 'text-long'}
  <div style="width: 120px">
    <Icon
      properties={{ icon: png, text: 'A very long icon caption that must wrap onto lines' }}
      on:click={log('click')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'text-html-chars'}
  <Icon
    properties={{ icon: svg, text: '<b>raw</b> & text' }}
    on:click={log('click')}
    on:keydown={log('keydown')}
  />
{:else if name === 'spread-defaults'}
  <Icon
    properties={{ ...defaultIconProperties, icon: png, text: 'Spread' }}
    on:click={log('click')}
    on:keydown={log('keydown')}
  />
{:else if name === 'direction-row'}
  <div class="row-theme">
    <Icon
      properties={{ icon: png, text: 'Inline' }}
      on:click={log('click')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'themed'}
  <div class="themed">
    <Icon
      properties={{ icon: svg, text: 'Themed' }}
      on:click={log('click')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'style-props'}
  <Icon
    properties={{ icon: png, text: 'Styled' }}
    on:click={log('click')}
    on:keydown={log('keydown')}
    --icon-container-paddding="12px"
    --icon-container-direction="row-reverse"
    --icon-height="40px"
    --icon-width="40px"
    --icon-padding="10px"
    --icon-text-padding="0px 10px"
    --icon-text-font-size="18px"
  />
{:else if name === 'text-direction'}
  <Icon
    properties={{ icon: png, text: 'Col text' }}
    on:click={log('click')}
    on:keydown={log('keydown')}
    --icon-text-direction="row"
    --icon-text-padding="10px"
  />
{:else if name === 'hover' || name === 'focus' || name === 'click' || name === 'click-text' || name === 'click-image' || name === 'keydown-enter' || name === 'keydown-space'}
  <Icon
    properties={{ icon: png, text: 'Wallet' }}
    on:click={log('click')}
    on:keydown={log('keydown')}
  />
{:else if name === 'narrow-wrap'}
  <div style="width: 40px; border: 1px solid #111827">
    <Icon
      properties={{ icon: svg, text: 'Narrow' }}
      on:click={log('click')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'in-flex-row'}
  <div style="display: flex; gap: 8px">
    <Icon
      properties={{ icon: png, text: 'One' }}
      on:click={log('click')}
      on:keydown={log('keydown')}
    />
    <Icon
      properties={{ icon: svg, text: 'Two' }}
      on:click={log('click')}
      on:keydown={log('keydown')}
    />
    <Icon
      properties={{ icon: png, text: '' }}
      on:click={log('click')}
      on:keydown={log('keydown')}
    />
  </div>
{/if}

<style>
  .row-theme {
    --icon-container-direction: row;
    --icon-text-direction: row;
  }
  .themed {
    --icon-container-paddding: 10px;
    --icon-container-direction: column-reverse;
    --icon-height: 48px;
    --icon-width: 48px;
    --icon-padding: 8px;
    --icon-text-padding: 6px;
    --icon-text-direction: row;
    --icon-text-font-size: 16px;
  }
</style>
