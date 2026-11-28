<script context="module">
  export const cases = [
    { name: 'default-null-icon', allowBlank: true },
    { name: 'back-png' },
    { name: 'back-svg' },
    { name: 'back-hidden' },
    { name: 'back-icon-null' },
    { name: 'text-only' },
    { name: 'text-with-back' },
    { name: 'text-empty-string' },
    { name: 'long-text' },
    { name: 'slot-left' },
    { name: 'slot-left-over-back' },
    { name: 'slot-center' },
    { name: 'slot-center-over-text' },
    { name: 'slot-right' },
    { name: 'slot-additional' },
    { name: 'slot-all' },
    { name: 'slot-all-with-back-and-text' },
    { name: 'vars-ancestor' },
    { name: 'vars-style-props' },
    { name: 'vars-back-button' },
    { name: 'static-position' },
    { name: 'click-back', actions: [['click', '.back']] },
    { name: 'click-back-hidden', actions: [['mouse', 20, 20]] },
    { name: 'hover-back', actions: [['hover', '.back']] },
    { name: 'focus-back', actions: [['focus', '.back']] },
    {
      name: 'key-back',
      actions: [
        ['focus', '.back'],
        ['key', 'Enter']
      ]
    }
  ];
</script>

<script>
  import { Toolbar, defaultToolbarProperties } from 'sui-v1-under-test';
  import { log, png, svg } from './_kit.js';
  export let name;

  const onBack = log('backClick');
  const base = { ...defaultToolbarProperties, backIcon: png };
</script>

{#if name === 'default-null-icon'}
  <Toolbar properties={{ ...defaultToolbarProperties, backIcon: null }} on:backClick={onBack} />
{:else if name === 'back-png' || name === 'click-back' || name === 'hover-back' || name === 'focus-back' || name === 'key-back'}
  <Toolbar properties={base} on:backClick={onBack} />
{:else if name === 'back-svg'}
  <Toolbar properties={{ ...base, backIcon: svg }} on:backClick={onBack} />
{:else if name === 'back-hidden' || name === 'click-back-hidden'}
  <Toolbar properties={{ ...base, showBackButton: false, text: 'No back' }} on:backClick={onBack} />
{:else if name === 'back-icon-null'}
  <Toolbar properties={{ ...base, backIcon: null, text: 'Null icon' }} on:backClick={onBack} />
{:else if name === 'text-only'}
  <Toolbar
    properties={{ ...base, showBackButton: false, text: 'Checkout' }}
    on:backClick={onBack}
  />
{:else if name === 'text-with-back'}
  <Toolbar properties={{ ...base, text: 'Checkout' }} on:backClick={onBack} />
{:else if name === 'text-empty-string'}
  <Toolbar properties={{ ...base, text: '' }} on:backClick={onBack} />
{:else if name === 'long-text'}
  <Toolbar
    properties={{
      ...base,
      text: 'A very long toolbar title that keeps going past the edge of the narrow viewport for sure'
    }}
    on:backClick={onBack}
  />
{:else if name === 'slot-left'}
  <Toolbar properties={{ ...base, showBackButton: false, text: 'Title' }} on:backClick={onBack}>
    <div slot="leftContent" class="box left">L</div>
  </Toolbar>
{:else if name === 'slot-left-over-back'}
  <Toolbar properties={{ ...base, text: 'Title' }} on:backClick={onBack}>
    <div slot="leftContent" class="box left">L</div>
  </Toolbar>
{:else if name === 'slot-center'}
  <Toolbar properties={{ ...base, showBackButton: false }} on:backClick={onBack}>
    <div slot="centerContent" class="box center">Center</div>
  </Toolbar>
{:else if name === 'slot-center-over-text'}
  <Toolbar properties={{ ...base, text: 'Ignored text' }} on:backClick={onBack}>
    <div slot="centerContent" class="box center">Center</div>
  </Toolbar>
{:else if name === 'slot-right'}
  <Toolbar properties={{ ...base, text: 'Title' }} on:backClick={onBack}>
    <div slot="rightContent" class="box right">R</div>
  </Toolbar>
{:else if name === 'slot-additional'}
  <Toolbar properties={{ ...base, text: 'Title' }} on:backClick={onBack}>
    <div slot="additionalContent" class="box additional">Additional row</div>
  </Toolbar>
{:else if name === 'slot-all'}
  <Toolbar properties={{ ...base, showBackButton: false }} on:backClick={onBack}>
    <div slot="leftContent" class="box left">L</div>
    <div slot="centerContent" class="box center">Center</div>
    <div slot="rightContent" class="box right">R</div>
    <div slot="additionalContent" class="box additional">Additional row</div>
  </Toolbar>
{:else if name === 'slot-all-with-back-and-text'}
  <Toolbar properties={{ ...base, text: 'Title' }} on:backClick={onBack}>
    <div slot="rightContent" class="box right">R</div>
    <div slot="additionalContent" class="box additional">Additional row</div>
  </Toolbar>
{:else if name === 'vars-ancestor'}
  <div class="themed">
    <Toolbar properties={{ ...base, text: 'Themed' }} on:backClick={onBack}>
      <div slot="rightContent" class="box right">R</div>
      <div slot="additionalContent" class="box additional">Additional row</div>
    </Toolbar>
  </div>
{:else if name === 'vars-style-props'}
  <Toolbar
    properties={{ ...base, text: 'Style props' }}
    on:backClick={onBack}
    --toolbar-padding="8px"
    --toolbar-height="120px"
    --toolbar-width="300px"
    --toolbar-top="40px"
    --toolbar-left="20px"
    --toolbar-right="auto"
    --toolbar-background="#dbeafe"
    --toolbar-box-shadow="0 4px 8px #1e3a8a66"
    --toolbar-z-index="30"
    --toolbar-border-radius="16px"
  >
    <div slot="additionalContent" class="box additional">Additional row</div>
  </Toolbar>
{:else if name === 'vars-back-button'}
  <div class="back-themed">
    <Toolbar properties={{ ...base, text: 'Back styled' }} on:backClick={onBack} />
  </div>
{:else if name === 'static-position'}
  <div class="static-wrap">
    <Toolbar
      properties={{ ...base, text: 'In flow' }}
      on:backClick={onBack}
      --toolbar-position="static"
      --toolbar-width="100%"
    />
    <div class="page-text">Content below</div>
  </div>
{/if}

<style>
  .box {
    font-family: sans-serif;
    font-size: 14px;
    padding: 6px 10px;
  }
  .left {
    background: #fecaca;
  }
  .center {
    flex: 1;
    background: #bbf7d0;
  }
  .right {
    background: #bfdbfe;
  }
  .additional {
    flex: 1;
    background: #fde68a;
  }
  .page-text {
    font-family: sans-serif;
    padding: 8px;
  }
  .static-wrap {
    width: 300px;
  }
  .themed {
    --toolbar-padding: 4px 8px;
    --toolbar-height: 100px;
    --toolbar-width: 380px;
    --toolbar-top: 12px;
    --toolbar-left: 10px;
    --toolbar-right: 10px;
    --toolbar-background: #1f2937;
    --toolbar-box-shadow: 0 6px 16px #00000080;
    --toolbar-z-index: 40;
    --toolbar-border-radius: 12px;
    --toolbar-content-padding: 6px 4px;
    --toolbar-justify-content: space-between;
    --toolbar-content-visibility: visible;
    --toolbar-additional-content-padding: 8px;
    --toolbar-additional-content-height: 40px;
    --toolbar-justify-additional-content: center;
    --toolbar-additional-content-visibility: visible;
    color: #f9fafb;
  }
  .back-themed {
    --toolbar-back-button-height: 40px;
    --toolbar-back-button-width: 40px;
    --toolbar-back-button-padding: 4px;
    --toolbar-back-button-cursor: default;
    --toolbar-back-image-height: 32px;
    --toolbar-back-image-width: 32px;
  }
</style>
