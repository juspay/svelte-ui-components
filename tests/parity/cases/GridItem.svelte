<script module>
  export const cases = [
    { name: 'basic' },
    { name: 'no-header-icon' },
    { name: 'header-icon-null' },
    { name: 'header-icon-svg' },
    { name: 'icon-svg' },
    { name: 'empty-text' },
    { name: 'long-text-truncates' },
    { name: 'text-one-word' },
    { name: 'empty-icon' },
    { name: 'show-loader' },
    { name: 'show-loader-with-header' },
    { name: 'click-toggles-loader', actions: [['click', '[data-pw="g"]']] },
    {
      name: 'double-click-toggles-back',
      actions: [
        ['click', '[data-pw="g"]'],
        ['click', '[data-pw="g"]']
      ]
    },
    { name: 'bind-show-loader', actions: [['click', '[data-pw="g"]']] },
    {
      name: 'keyboard-enter',
      actions: [
        ['focus', '[data-pw="g"]'],
        ['key', 'Enter']
      ]
    },
    {
      name: 'keyboard-space',
      actions: [
        ['focus', '[data-pw="g"]'],
        ['key', ' ']
      ]
    },
    {
      name: 'keyboard-other-key',
      actions: [
        ['focus', '[data-pw="g"]'],
        ['key', 'a']
      ]
    },
    { name: 'focus-state', actions: [['focus', '[data-pw="g"]']] },
    { name: 'hover-state', actions: [['hover', '[data-pw="g"]']] },
    { name: 'classes-and-testid' },
    { name: 'grid-of-four' },
    { name: 'css-variables' },
    { name: 'css-variables-footer-wrap' },
    { name: 'css-variables-header-position' }
  ];
</script>

<script>
  import { GridItem } from 'sui-under-test';
  import { log, note, png, svg } from './_kit.js';
  let { name } = $props();
  let loader = $state(false);
  $effect(() => note('showLoader', loader));
</script>

<div class="grid-fixture" style="padding: 8px; font-family: sans-serif;">
  {#if name === 'basic'}
    <GridItem icon={png} text="Basic" />
  {:else if name === 'no-header-icon'}
    <GridItem icon={png} text="No header" />
  {:else if name === 'header-icon-null'}
    <GridItem icon={png} text="Null header" headerIcon={null} />
  {:else if name === 'header-icon-svg'}
    <GridItem icon={png} headerIcon={svg} text="Header" />
  {:else if name === 'icon-svg'}
    <GridItem icon={svg} headerIcon={png} text="Svg icon" />
  {:else if name === 'empty-text'}
    <GridItem icon={png} text="" />
  {:else if name === 'long-text-truncates'}
    <GridItem icon={png} text="An extremely long grid item caption" />
  {:else if name === 'text-one-word'}
    <GridItem icon={png} text="Pay" />
  {:else if name === 'empty-icon'}
    <GridItem icon="" text="No icon" />
  {:else if name === 'show-loader'}
    <GridItem icon={png} text="Loading" showLoader />
  {:else if name === 'show-loader-with-header'}
    <GridItem icon={png} headerIcon={svg} text="Loading" showLoader />
  {:else if name === 'click-toggles-loader'}
    <GridItem icon={png} text="Click" testId="g" onclick={log('onclick')} />
  {:else if name === 'double-click-toggles-back'}
    <GridItem icon={png} text="Click" testId="g" onclick={log('onclick')} />
  {:else if name === 'bind-show-loader'}
    <GridItem
      icon={png}
      text="Bound"
      testId="g"
      bind:showLoader={loader}
      onclick={log('onclick')}
    />
  {:else if name === 'keyboard-enter' || name === 'keyboard-space' || name === 'keyboard-other-key'}
    <GridItem
      icon={png}
      text="Keys"
      testId="g"
      onclick={log('onclick')}
      onkeydown={log('onkeydown')}
    />
  {:else if name === 'focus-state'}
    <GridItem icon={png} text="Focus" testId="g" onkeydown={log('onkeydown')} />
  {:else if name === 'hover-state'}
    <GridItem icon={png} text="Hover" testId="g" />
  {:else if name === 'classes-and-testid'}
    <GridItem icon={png} text="Attrs" classes="extra-class" testId="g" />
  {:else if name === 'grid-of-four'}
    <div style="display: grid; grid-template-columns: repeat(4, 80px); gap: 8px;">
      <GridItem icon={png} text="One" headerIcon={svg} />
      <GridItem icon={svg} text="Two" />
      <GridItem icon={png} text="Three" showLoader />
      <GridItem icon={svg} text="Four" headerIcon={png} />
    </div>
  {:else if name === 'css-variables'}
    <div
      style="--grid-item-width: 100px; --grid-item-height: 130px; --grid-item-body-width: 90px; --grid-item-body-height: 90px; --grid-item-background-color: #fef3c7; --grid-item-border: 2px solid #d97706; --grid-item-border-radius: 16px; --grid-item-margin: 12px 0 0 0; --grid-item-icon-height: 48px; --grid-item-font-size: 18px; --grid-item-color: #7c2d12; --grid-item-header-icon-height: 24px;"
    >
      <GridItem icon={png} headerIcon={svg} text="Styled" />
    </div>
  {:else if name === 'css-variables-footer-wrap'}
    <div
      style="--grid-item-footer-white-space: normal; --grid-item-footer-height: 40px; --grid-item-footer-text-align: left; --grid-item-footer-margin: 2px 0 0 0; --grid-item-height: 140px; --grid-item-icon-object-fit: cover; --grid-item-icon-width: 40px;"
    >
      <GridItem icon={png} text="Wrapped caption text" />
    </div>
  {:else if name === 'css-variables-header-position'}
    <div
      style="--grid-header-position: static; --grid-header-justify-content: center; --grid-header-top: 0px; --grid-item-header-icon-height: 20px; --grid-item-height: 130px;"
    >
      <GridItem icon={png} headerIcon={svg} text="Static header" />
    </div>
  {/if}
</div>

<style>
  /* Compare the visible loading state at a fixed frame on both stacks. */
  .grid-fixture :global(.grid-body-loader)::before {
    animation: none;
  }
</style>
