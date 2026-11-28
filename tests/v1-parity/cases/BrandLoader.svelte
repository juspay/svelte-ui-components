<script context="module">
  export const cases = [
    { name: 'text' },
    { name: 'text-empty' },
    { name: 'sub-text' },
    { name: 'sub-text-null' },
    { name: 'sub-text-empty' },
    { name: 'sub-text-long' },
    { name: 'logo-svg' },
    { name: 'not-fullscreen' },
    { name: 'background-image-prop' },
    { name: 'themed-text-colour' },
    { name: 'themed-logo-size' },
    { name: 'themed-dot-colour' },
    { name: 'themed-all' },
    { name: 'style-props' },
    { name: 'boxed-size' },
    { name: 'layout-row' },
    { name: 'ellipsis-overrides' },
    { name: 'background-and-blur' }
  ];
</script>

<script>
  import { BrandLoader, defaultBrandLoaderProperties } from 'sui-v1-under-test';
  import { png, svg } from './_kit.js';
  export let name;
  const base = {
    ...defaultBrandLoaderProperties,
    brandLogoURL: png,
    loaderBackgroundImage: svg,
    brandText: 'Acme Pay',
    subText: null
  };
</script>

{#if name === 'text'}
  <BrandLoader properties={base} />
{:else if name === 'text-empty'}
  <BrandLoader properties={{ ...base, brandText: '' }} />
{:else if name === 'sub-text'}
  <BrandLoader properties={{ ...base, subText: 'Securing your payment' }} />
{:else if name === 'sub-text-null'}
  <BrandLoader properties={{ ...base, subText: null }} />
{:else if name === 'sub-text-empty'}
  <BrandLoader properties={{ ...base, subText: '' }} />
{:else if name === 'sub-text-long'}
  <BrandLoader
    properties={{
      ...base,
      subText:
        'Please do not close or refresh this page while we confirm your payment with the bank'
    }}
  />
{:else if name === 'logo-svg'}
  <BrandLoader properties={{ ...base, brandLogoURL: svg, subText: 'Loading' }} />
{:else if name === 'not-fullscreen'}
  <BrandLoader properties={{ ...base, fullScreen: false, subText: 'Not full screen' }} />
{:else if name === 'background-image-prop'}
  <BrandLoader properties={{ ...base, loaderBackgroundImage: png, subText: 'Background set' }} />
{:else if name === 'themed-text-colour'}
  <div class="text-theme">
    <BrandLoader properties={{ ...base, subText: 'Coloured text' }} />
  </div>
{:else if name === 'themed-logo-size'}
  <div class="logo-theme">
    <BrandLoader properties={{ ...base, subText: 'Big logo' }} />
  </div>
{:else if name === 'themed-dot-colour'}
  <div class="dot-theme">
    <BrandLoader properties={{ ...base, subText: 'Red dots' }} />
  </div>
{:else if name === 'themed-all'}
  <div class="text-theme logo-theme dot-theme all-theme">
    <BrandLoader properties={{ ...base, subText: 'Everything' }} />
  </div>
{:else if name === 'style-props'}
  <BrandLoader
    properties={{ ...base, subText: 'Style props' }}
    --loader-text-color="#be123c"
    --loader-text-font-size="30px"
    --loader-text-padding="4px 0px"
    --loader-img-height="60px"
    --loader-img-width="60px"
    --loader-dot-color="#047857"
    --loader-sub-text-font-size="16px"
    --loader-sub-text-margin="4px"
    --loader-background-color="#fef3c7"
  />
{:else if name === 'boxed-size'}
  <BrandLoader
    properties={{ ...base, subText: 'Boxed' }}
    --loader-height="300px"
    --loader-width="300px"
    --loader-background-height="300px"
    --loader-background-width="300px"
    --loader-background-border-radius="24px"
    --loader-text-color="#111827"
  />
{:else if name === 'layout-row'}
  <BrandLoader
    properties={{ ...base, subText: 'Row' }}
    --loader-flex-direction="row"
    --loader-justify-content="flex-start"
    --loader-align-items="flex-end"
    --loader-text-color="#111827"
  />
{:else if name === 'ellipsis-overrides'}
  <BrandLoader
    properties={{ ...base, subText: 'Dots' }}
    --loader-text-color="#111827"
    --loader-ellipsis-display="block"
    --loader-ellipsis-position="relative"
    --loader-ellipsis-width="120px"
    --loader-ellipsis-height="40px"
    --loader-ellipsis-div-display="block"
    --loader-ellipsis-div-position="absolute"
    --loader-ellipsis-div-top="10px"
    --loader-ellipsis-div-width="20px"
    --loader-ellipsis-div-height="20px"
    --loader-ellipsis-div-border-radius="4px"
    --loader-ellipsis-animation-timing="linear"
    --loader-dot-color="#7c3aed"
  />
{:else if name === 'background-and-blur'}
  <div style="background: linear-gradient(135deg, #f97316, #1d4ed8); width: 420px; height: 800px">
    <BrandLoader
      properties={{ ...base, subText: 'Blurred' }}
      --loader-background-color="#ffffff66"
      --loader-backdrop-blur="2px"
      --loader-webkit-backdrop-filter="2px"
      --loader-text-font="monospace"
    />
  </div>
{/if}

<style>
  .text-theme {
    --loader-text-color: #be123c;
    --loader-text-font-size: 28px;
    --loader-text-padding: 8px 0px;
    --loader-text-font: serif;
    --loader-sub-text-font-size: 14px;
    --loader-sub-text-margin: 8px;
  }
  .logo-theme {
    --loader-img-height: 80px;
    --loader-img-width: 80px;
  }
  .dot-theme {
    --loader-dot-color: #dc2626;
  }
  .all-theme {
    --loader-background-color: #dbeafe;
    --loader-text-color: #1e3a8a;
  }
</style>
