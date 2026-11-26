<script module>
  export const cases = [
    { name: 'required-only' },
    { name: 'text-only' },
    { name: 'variant-primary' },
    { name: 'variant-secondary' },
    { name: 'variant-ghost' },
    { name: 'variant-destructive' },
    { name: 'variant-brand-gradient' },
    { name: 'size-sm' },
    { name: 'size-md' },
    { name: 'size-lg' },
    { name: 'icon-only-sizes' },
    { name: 'full-width' },
    { name: 'long-text-ellipsis' },
    { name: 'long-text-shrinkable' },
    { name: 'long-text-wrap-var' },
    { name: 'empty-text' },
    { name: 'icon-and-text' },
    { name: 'children-snippet' },
    { name: 'allow-html' },
    { name: 'html-escaped' },
    { name: 'disabled' },
    { name: 'disabled-click', actions: [['click', 'button', { force: true }]] },
    { name: 'enable-false' },
    { name: 'loading' },
    { name: 'loading-click', actions: [['click', 'button', { force: true }]] },
    { name: 'legacy-circular-loader' },
    {
      name: 'legacy-progress-bar',
      actions: [
        ['click', 'button'],
        ['wait', 50]
      ]
    },
    { name: 'show-progress-bar-bound' },
    { name: 'href-link' },
    { name: 'href-blank-rel' },
    { name: 'href-custom-rel' },
    { name: 'href-disabled', actions: [['click', 'a', { force: true }]] },
    { name: 'type-submit-reset' },
    { name: 'aria-attrs' },
    { name: 'role-title-testid' },
    { name: 'status-text' },
    { name: 'status-text-empty' },
    { name: 'native-attrs' },
    { name: 'unstyled' },
    { name: 'unstyled-with-classes' },
    { name: 'element-classes' },
    { name: 'wrapper-classes-style' },
    { name: 'click', actions: [['click', 'button']] },
    {
      name: 'mouse-events',
      actions: [
        ['click', 'button'],
        ['mouse', 380, 700]
      ]
    },
    {
      name: 'keyboard',
      actions: [
        ['focus', 'button'],
        ['key', 'Enter'],
        ['key', ' ']
      ]
    },
    { name: 'hover-primary', actions: [['hover', 'button']] },
    { name: 'hover-secondary', actions: [['hover', 'button']] },
    { name: 'hover-brand', actions: [['hover', 'button']] },
    { name: 'focus', actions: [['focus', 'button']] },
    { name: 'element-bound', actions: [['click', '#t']] },
    { name: 'css-vars' }
  ];
</script>

<script>
  import { Button } from 'sui-under-test';
  import { log, note, svg } from './_kit.js';
  let { name } = $props();

  let el = $state(null);
  let bar = $state(false);
  $effect(() => note('element-tag', el ? el.tagName : null));
  $effect(() => note('showProgressBar', bar));
  const longText = 'A considerably long button label that will not fit in its narrow container';
</script>

{#snippet iconSnip()}
  <img src={svg} width="16" height="16" alt="" />
{/snippet}
{#snippet childSnip()}
  <span style="color: #fde68a; font-weight: 700">Custom child</span>
{/snippet}

{#if name === 'required-only'}
  <Button />
{:else if name === 'text-only'}
  <Button text="Save" />
{:else if name === 'variant-primary'}
  <Button text="Primary" variant="primary" />
{:else if name === 'variant-secondary'}
  <Button text="Secondary" variant="secondary" />
{:else if name === 'variant-ghost'}
  <Button text="Ghost" variant="ghost" />
{:else if name === 'variant-destructive'}
  <Button text="Destructive" variant="destructive" />
{:else if name === 'variant-brand-gradient'}
  <div style="--button-background: linear-gradient(90deg, #7c3aed, #db2777);">
    <Button text="Brand" variant="brand" />
  </div>
{:else if name === 'size-sm'}
  <Button text="Small" size="sm" />
{:else if name === 'size-md'}
  <Button text="Medium" size="md" />
{:else if name === 'size-lg'}
  <Button text="Large" size="lg" />
{:else if name === 'icon-only-sizes'}
  <div style="display: flex; gap: 12px; align-items: center">
    <Button iconOnly size="sm" ariaLabel="Small icon" icon={iconSnip} />
    <Button iconOnly size="md" ariaLabel="Medium icon" icon={iconSnip} />
    <Button iconOnly size="lg" ariaLabel="Large icon" icon={iconSnip} />
    <Button iconOnly={false} text="No" icon={iconSnip} />
  </div>
{:else if name === 'full-width'}
  <div style="width: 360px">
    <Button text="Full width" fullWidth />
    <div style="height: 8px"></div>
    <Button text="Not full width" fullWidth={false} />
  </div>
{:else if name === 'long-text-ellipsis'}
  <div style="width: 200px; overflow: hidden">
    <Button text={longText} fullWidth />
  </div>
{:else if name === 'long-text-shrinkable'}
  <div style="width: 200px">
    <Button text={longText} shrinkable />
    <div style="height: 8px"></div>
    <Button text="Short" shrinkable />
    <div style="height: 8px"></div>
    <Button iconOnly shrinkable ariaLabel="Icon" icon={iconSnip} />
  </div>
{:else if name === 'long-text-wrap-var'}
  <div style="width: 200px; --button-white-space: normal">
    <Button text={longText} fullWidth />
  </div>
{:else if name === 'empty-text'}
  <Button text="" />
{:else if name === 'icon-and-text'}
  <Button text="With icon" icon={iconSnip} />
{:else if name === 'children-snippet'}
  <div style="display: flex; gap: 12px">
    <Button children={childSnip} />
    <Button text="Text and child" children={childSnip} />
  </div>
{:else if name === 'allow-html'}
  <Button text="<b>Bold</b> and <i>italic</i>" allowHtml />
{:else if name === 'html-escaped'}
  <Button text="<b>Bold</b> and <i>italic</i>" allowHtml={false} />
{:else if name === 'disabled'}
  <div style="display: flex; gap: 12px; flex-wrap: wrap">
    <Button text="Disabled" disabled />
    <Button text="Secondary" variant="secondary" disabled />
    <Button text="Ghost" variant="ghost" disabled />
    <Button text="Enabled" disabled={false} />
  </div>
{:else if name === 'disabled-click'}
  <Button text="Disabled" disabled onclick={log('onclick')} />
{:else if name === 'enable-false'}
  <Button text="enable=false" enable={false} />
{:else if name === 'loading'}
  <div style="display: flex; gap: 12px; flex-wrap: wrap">
    <Button text="Loading" loading />
    <Button loading ariaLabel="Only spinner" />
    <Button text="Not loading" loading={false} />
  </div>
{:else if name === 'loading-click'}
  <Button text="Loading" loading onclick={log('onclick')} />
{:else if name === 'legacy-circular-loader'}
  <Button text="Circular" showLoader loaderType="Circular" />
{:else if name === 'legacy-progress-bar'}
  <Button
    text="Progress"
    showLoader
    loaderType="ProgressBar"
    onclick={log('onclick')}
    style="--button-progress-loader-duration: 100s"
  />
{:else if name === 'show-progress-bar-bound'}
  <Button
    text="Bar on"
    bind:showProgressBar={bar}
    style="--button-progress-loader-duration: 100s"
  />
{:else if name === 'href-link'}
  <Button text="Link" href="#target" onclick={log('onclick')} />
{:else if name === 'href-blank-rel'}
  <Button text="Blank" href="#blank" target="_blank" />
{:else if name === 'href-custom-rel'}
  <Button text="Custom rel" href="#rel" target="_blank" rel="nofollow" />
{:else if name === 'href-disabled'}
  <Button text="Disabled link" href="#nope" disabled onclick={log('onclick')} />
{:else if name === 'type-submit-reset'}
  <form
    onsubmit={(e) => {
      e.preventDefault();
      log('submit')(e);
    }}
    style="display: flex; gap: 12px"
  >
    <Button text="Submit" type="submit" />
    <Button text="Reset" type="reset" />
    <Button text="Button" type="button" />
  </form>
{:else if name === 'aria-attrs'}
  <div style="display: flex; gap: 12px; flex-wrap: wrap">
    <Button
      text="A"
      ariaLabel="Label"
      ariaExpanded={true}
      ariaControls="panel"
      ariaHaspopup="menu"
    />
    <Button text="B" ariaSelected={true} ariaPressed={true} ariaBusy={true} />
    <Button text="C" ariaExpanded={false} ariaPressed={false} ariaHaspopup={false} />
  </div>
{:else if name === 'role-title-testid'}
  <Button text="Tab" role="tab" title="Tooltip" testId="btn-a" />
{:else if name === 'status-text'}
  <Button text="Copy" statusText="Copied" statusTestId="status" />
{:else if name === 'status-text-empty'}
  <Button text="Copy" statusText="" />
{:else if name === 'native-attrs'}
  <Button
    text="Native"
    nativeAttrs={{ id: 'native-id', tabindex: 3, 'data-x': 'y', style: 'letter-spacing: 3px' }}
  />
{:else if name === 'unstyled'}
  <Button text="Unstyled" unstyled />
{:else if name === 'unstyled-with-classes'}
  <Button
    text="Unstyled classes"
    unstyled
    classes="ghost-x"
    style="color: #b91c1c; padding: 10px; border: 2px dashed #b91c1c"
  />
{:else if name === 'element-classes'}
  <Button text="Element class" elementClasses="el-x" />
{:else if name === 'wrapper-classes-style'}
  <Button text="Wrapper" classes="wrap-x" style="margin: 20px; outline: 2px solid #0ea5e9" />
{:else if name === 'click'}
  <Button text="Click me" onclick={log('onclick')} />
{:else if name === 'mouse-events'}
  <Button
    text="Mouse"
    onmousedown={log('onmousedown')}
    onmouseup={log('onmouseup')}
    onmouseleave={log('onmouseleave')}
    onclick={log('onclick')}
    ontouchstart={log('ontouchstart')}
    ontouchend={log('ontouchend')}
  />
{:else if name === 'keyboard'}
  <Button
    text="Keys"
    onkeydown={log('onkeydown')}
    onkeyup={log('onkeyup')}
    onclick={log('onclick')}
  />
{:else if name === 'hover-primary'}
  <Button text="Hover" />
{:else if name === 'hover-secondary'}
  <Button text="Hover" variant="secondary" />
{:else if name === 'hover-brand'}
  <div
    style="--button-background: linear-gradient(90deg, #0ea5e9, #22c55e); --button-hover-color: #0f172a"
  >
    <Button text="Hover" variant="brand" />
  </div>
{:else if name === 'focus'}
  <div style="--button-focus-visible-box-shadow: 0 0 0 3px #f59e0b">
    <Button text="Focused" />
  </div>
{:else if name === 'element-bound'}
  <button id="t" onclick={() => el?.focus()}>focus</button>
  <Button text="Bound" bind:element={el} onclick={log('onclick')} />
  <Button text="Anchor" href="#a" />
{:else if name === 'css-vars'}
  <div
    style="--button-color: #0f766e; --button-text-color: #fef3c7; --button-border-radius: 20px; --button-padding: 10px 30px; --button-font-size: 18px; --button-font-weight: 700; --button-border: 3px solid #f59e0b; --button-box-shadow: 0 4px 10px #00000055; --button-content-gap: 4px; --button-text-decoration: underline; --button-height: 60px; --button-min-width: 200px;"
  >
    <Button text="Custom" icon={iconSnip} />
  </div>
{/if}
