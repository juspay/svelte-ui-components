<script context="module">
  export const cases = [
    { name: 'default' },
    { name: 'icon' },
    { name: 'icon-svg' },
    { name: 'text' },
    { name: 'text-long' },
    { name: 'text-empty-with-icon' },
    { name: 'header-icon' },
    { name: 'all-props' },
    { name: 'loader-on' },
    { name: 'loader-on-no-icon' },
    { name: 'click', actions: [['click', '.container']] },
    {
      name: 'click-twice',
      actions: [
        ['click', '.container'],
        ['click', '.container']
      ]
    },
    { name: 'click-loader-on', actions: [['click', '.container']] },
    { name: 'click-icon', actions: [['click', '.grid-item-icon']] },
    { name: 'click-footer', actions: [['click', '.grid-item-footer']] },
    { name: 'click-header-icon', actions: [['click', '.grid-item-header-icon']] },
    { name: 'keydown-enter', actions: [['press', '.container', 'Enter']] },
    { name: 'hover', actions: [['hover', '.container']] },
    { name: 'focus', actions: [['focus', '.container']] },
    { name: 'bound-loader-click', actions: [['click', '.container']] },
    { name: 'external-loader-toggle', actions: [['click', '#t']] },
    { name: 'themed' },
    { name: 'themed-loader' },
    { name: 'style-props' },
    { name: 'header-position' },
    { name: 'footer-wrap' },
    { name: 'grid-of-four' }
  ];
</script>

<script>
  import { GridItem } from 'sui-v1-under-test';
  import { log, note, png, svg } from './_kit.js';
  export let name;
  let loading = name === 'click-loader-on';
  $: note('showLoader', loading);
</script>

{#if name === 'default'}
  <GridItem on:click={log('click')} on:keydown={log('keydown')} />
{:else if name === 'icon'}
  <GridItem icon={png} on:click={log('click')} on:keydown={log('keydown')} />
{:else if name === 'icon-svg'}
  <GridItem icon={svg} text="Svg" on:click={log('click')} on:keydown={log('keydown')} />
{:else if name === 'text'}
  <GridItem icon={png} text="Cards" on:click={log('click')} on:keydown={log('keydown')} />
{:else if name === 'text-long'}
  <GridItem
    icon={png}
    text="A very long caption that must be truncated"
    on:click={log('click')}
    on:keydown={log('keydown')}
  />
{:else if name === 'text-empty-with-icon'}
  <GridItem icon={png} text="" on:click={log('click')} on:keydown={log('keydown')} />
{:else if name === 'header-icon'}
  <GridItem
    icon={png}
    text="Offer"
    headerIcon={svg}
    on:click={log('click')}
    on:keydown={log('keydown')}
  />
{:else if name === 'all-props'}
  <GridItem
    icon={png}
    text="Wallet"
    headerIcon={svg}
    showLoader={false}
    on:click={log('click')}
    on:keydown={log('keydown')}
  />
{:else if name === 'loader-on'}
  <GridItem
    icon={png}
    text="Loading"
    headerIcon={svg}
    showLoader={true}
    on:click={log('click')}
    on:keydown={log('keydown')}
  />
{:else if name === 'loader-on-no-icon'}
  <GridItem text="Empty" showLoader={true} on:click={log('click')} on:keydown={log('keydown')} />
{:else if name === 'click' || name === 'click-twice' || name === 'click-icon' || name === 'click-footer' || name === 'click-header-icon' || name === 'keydown-enter'}
  <GridItem
    icon={png}
    text="Cards"
    headerIcon={svg}
    on:click={log('click')}
    on:keydown={log('keydown')}
  />
{:else if name === 'click-loader-on'}
  <GridItem
    icon={png}
    text="Cards"
    headerIcon={svg}
    bind:showLoader={loading}
    on:click={log('click')}
    on:keydown={log('keydown')}
  />
{:else if name === 'hover' || name === 'focus'}
  <GridItem
    icon={png}
    text="Cards"
    headerIcon={svg}
    on:click={log('click')}
    on:keydown={log('keydown')}
  />
{:else if name === 'bound-loader-click'}
  <GridItem
    icon={png}
    text="Bound"
    bind:showLoader={loading}
    on:click={log('click')}
    on:keydown={log('keydown')}
  />
{:else if name === 'external-loader-toggle'}
  <button id="t" on:click={() => (loading = !loading)}>toggle</button>
  <GridItem
    icon={png}
    text="Outside"
    showLoader={loading}
    on:click={log('click')}
    on:keydown={log('keydown')}
  />
{:else if name === 'themed'}
  <div class="themed">
    <GridItem
      icon={png}
      text="Themed"
      headerIcon={svg}
      on:click={log('click')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'themed-loader'}
  <div class="themed">
    <GridItem
      icon={png}
      text="Loader"
      showLoader={true}
      on:click={log('click')}
      on:keydown={log('keydown')}
    />
  </div>
{:else if name === 'style-props'}
  <GridItem
    icon={svg}
    text="Styled"
    headerIcon={png}
    on:click={log('click')}
    on:keydown={log('keydown')}
    --grid-item-height="120px"
    --grid-item-width="90px"
    --grid-item-body-height="80px"
    --grid-item-body-width="80px"
    --grid-item-background-color="#fef3c7"
    --grid-item-border="2px solid #b45309"
    --grid-item-border-radius="16px"
    --grid-item-margin="4px 0 0 0"
    --grid-item-icon-height="44px"
    --grid-item-icon-width="44px"
    --grid-item-icon-object-fit="cover"
    --grid-item-font-size="16px"
    --grid-item-color="#7c2d12"
  />
{:else if name === 'header-position'}
  <GridItem
    icon={png}
    text="Header"
    headerIcon={svg}
    on:click={log('click')}
    on:keydown={log('keydown')}
    --grid-header-width="50%"
    --grid-header-justify-content="start"
    --grid-header-position="absolute"
    --grid-header-top="0px"
    --grid-header-z-index="1"
    --grid-item-header-icon-height="24px"
    --grid-item-header-icon-width="24px"
    --grid-item-header-icon-object-fit="fill"
    --grid-item-header-icon-z-index="5"
    --grid-item-icon-z-index="1"
  />
{:else if name === 'footer-wrap'}
  <GridItem
    icon={png}
    text="Footer text that wraps instead of truncating"
    on:click={log('click')}
    on:keydown={log('keydown')}
    --grid-item-footer-white-space="normal"
    --grid-item-footer-overflow="visible"
    --grid-item-footer-text-overflow="clip"
    --grid-item-footer-text-align="left"
    --grid-item-footer-margin="2px 0 0 0"
    --grid-item-footer-width="90%"
    --grid-item-footer-height="auto"
    --grid-item-height="140px"
  />
{:else if name === 'grid-of-four'}
  <div style="display: grid; grid-template-columns: repeat(4, 80px); gap: 8px">
    <GridItem icon={png} text="One" on:click={log('click')} on:keydown={log('keydown')} />
    <GridItem
      icon={svg}
      text="Two"
      headerIcon={svg}
      on:click={log('click')}
      on:keydown={log('keydown')}
    />
    <GridItem
      icon={png}
      text="Three"
      showLoader={true}
      on:click={log('click')}
      on:keydown={log('keydown')}
    />
    <GridItem icon={svg} text="Four" on:click={log('click')} on:keydown={log('keydown')} />
  </div>
{/if}

<style>
  .themed {
    --grid-item-height: 110px;
    --grid-item-width: 80px;
    --grid-item-body-height: 72px;
    --grid-item-body-width: 72px;
    --grid-item-background-color: #ecfdf5;
    --grid-item-border: 1px solid #047857;
    --grid-item-border-radius: 12px;
    --grid-item-margin: 6px 0 0 0;
    --grid-item-icon-height: 36px;
    --grid-item-font-size: 12px;
    --grid-item-color: #064e3b;
    --animation-version: 6px solid #04785799;
    --loader-animation-duration: 100s;
  }
</style>
