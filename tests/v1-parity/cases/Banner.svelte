<script context="module">
  export const cases = [
    { name: 'default-no-props', allowBlank: true },
    { name: 'properties-null', allowBlank: true },
    { name: 'text-only' },
    { name: 'icon-png' },
    { name: 'icon-svg' },
    { name: 'icon-null' },
    { name: 'link-text' },
    { name: 'link-text-empty' },
    { name: 'link-text-null' },
    { name: 'icon-and-link' },
    { name: 'empty-text' },
    { name: 'long-text' },
    { name: 'long-text-with-link' },
    { name: 'right-content' },
    { name: 'right-content-with-icon-link' },
    { name: 'wrap-allowed' },
    { name: 'vars-ancestor' },
    { name: 'vars-style-props' },
    { name: 'vars-image-and-layout' },
    { name: 'click', actions: [['click', '.banner']] },
    { name: 'click-link-text', actions: [['click', '.link-text']] },
    {
      name: 'key-enter',
      actions: [
        ['focus', '.banner'],
        ['key', 'Enter']
      ]
    },
    { name: 'click-right-content', actions: [['click', '.right-content']] },
    { name: 'hover', actions: [['hover', '.banner']] },
    { name: 'focus', actions: [['focus', '.banner']] }
  ];
</script>

<script>
  import { Banner } from 'sui-v1-under-test';
  import { log, png, svg } from './_kit.js';
  export let name;

  const onClick = log('click');
  const text = 'Free delivery on orders above 500';
  const long =
    'This is a very long banner message that definitely does not fit on a single line in the narrow viewport';
</script>

{#if name === 'default-no-props'}
  <Banner on:click={onClick} />
{:else if name === 'properties-null'}
  <Banner properties={null} on:click={onClick} />
{:else if name === 'text-only' || name === 'click' || name === 'key-enter' || name === 'hover' || name === 'focus'}
  <Banner properties={{ icon: null, text, linkText: null }} on:click={onClick} />
{:else if name === 'icon-png'}
  <Banner properties={{ icon: png, text, linkText: null }} on:click={onClick} />
{:else if name === 'icon-svg'}
  <Banner properties={{ icon: svg, text, linkText: null }} on:click={onClick} />
{:else if name === 'icon-null'}
  <Banner properties={{ icon: null, text, linkText: 'Details' }} on:click={onClick} />
{:else if name === 'link-text' || name === 'click-link-text'}
  <Banner properties={{ icon: null, text: text + ' ', linkText: 'Know more' }} on:click={onClick} />
{:else if name === 'link-text-empty'}
  <Banner properties={{ icon: null, text, linkText: '' }} on:click={onClick} />
{:else if name === 'link-text-null'}
  <Banner properties={{ icon: png, text, linkText: null }} on:click={onClick} />
{:else if name === 'icon-and-link'}
  <Banner properties={{ icon: png, text: text + ' ', linkText: 'Know more' }} on:click={onClick} />
{:else if name === 'empty-text'}
  <Banner properties={{ icon: png, text: '', linkText: null }} on:click={onClick} />
{:else if name === 'long-text'}
  <Banner properties={{ icon: png, text: long, linkText: null }} on:click={onClick} />
{:else if name === 'long-text-with-link'}
  <Banner properties={{ icon: svg, text: long + ' ', linkText: 'Read more' }} on:click={onClick} />
{:else if name === 'right-content' || name === 'click-right-content'}
  <Banner properties={{ icon: null, text, linkText: null }} on:click={onClick}>
    <span slot="rightContent" class="chip">Apply</span>
  </Banner>
{:else if name === 'right-content-with-icon-link'}
  <Banner properties={{ icon: png, text: 'Offer ', linkText: 'T&C' }} on:click={onClick}>
    <span slot="rightContent" class="chip">Apply</span>
  </Banner>
{:else if name === 'wrap-allowed'}
  <div class="wrap">
    <Banner properties={{ icon: png, text: long, linkText: 'More' }} on:click={onClick} />
  </div>
{:else if name === 'vars-ancestor'}
  <div class="themed">
    <Banner properties={{ icon: png, text: text + ' ', linkText: 'Know more' }} on:click={onClick}>
      <span slot="rightContent" class="chip">Apply</span>
    </Banner>
  </div>
{:else if name === 'vars-style-props'}
  <Banner
    properties={{ icon: png, text: text + ' ', linkText: 'Know more' }}
    on:click={onClick}
    --banner-bg-color="#fee2e2"
    --banner-text-color="#991b1b"
    --banner-img-height="24px"
    --banner-img-width="24px"
    --banner-height="56px"
    --banner-padding="16px 20px"
    --banner-linktext-color="#1d4ed8"
  />
{:else if name === 'vars-image-and-layout'}
  <div class="layout">
    <Banner properties={{ icon: svg, text: 'Layout vars', linkText: 'Go' }} on:click={onClick}>
      <span slot="rightContent" class="chip">Apply</span>
    </Banner>
  </div>
{/if}

<style>
  .chip {
    font-family: sans-serif;
    font-size: 12px;
    background: #111827;
    color: #fff;
    padding: 2px 8px;
    border-radius: 8px;
  }
  .wrap {
    --banner-text-white-space: normal;
    --banner-height: auto;
    --banner-overflow: visible;
  }
  .themed {
    --banner-position: relative;
    --banner-top: 10px;
    --banner-display: flex;
    --banner-align-items: flex-start;
    --banner-bg-color: #dcfce7;
    --banner-width: 380px;
    --banner-height: 64px;
    --banner-padding: 8px 16px;
    --banner-gap: 16px;
    --banner-justify-content: space-between;
    --banner-cursor: default;
    --banner-img-color: #15803d;
    --banner-img-width: 28px;
    --banner-img-height: 28px;
    --banner-img-margin-bottom: 0px;
    --banner-image-align-items: flex-start;
    --banner-text-flex: 1;
    --banner-text-order: 2;
    --banner-font-family: serif;
    --banner-font-style: italic;
    --banner-text-color: #14532d;
    --banner-font-size: 16px;
    --banner-line-height: 22px;
    --banner-font-weight: 700;
    --banner-text-overflow: clip;
    --banner-text-align-items: flex-start;
    --banner-linktext-color: #b91c1c;
    --banner-right-content-order: 3;
    --banner-right-content-display: block;
  }
  .layout {
    --banner-position: static;
    --banner-width: 300px;
    --banner-height: 80px;
    --banner-padding: 20px;
    --banner-img-height: 40px;
    --banner-img-width: 40px;
    --banner-img-margin-bottom: 12px;
    --banner-justify-content: flex-start;
    --banner-bg-color: #e0e7ff;
  }
</style>
