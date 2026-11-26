<script module>
  export const cases = [
    { name: 'required-only' },
    { name: 'with-sub-text' },
    { name: 'sub-text-empty' },
    { name: 'sub-text-null' },
    { name: 'sub-text-long' },
    { name: 'brand-text-long' },
    { name: 'brand-text-empty' },
    { name: 'svg-logo' },
    { name: 'testid' },
    { name: 'classes' },
    { name: 'embedded-box' },
    { name: 'embedded-small-box' },
    { name: 'on-colored-backdrop' },
    { name: 'css-text-vars' },
    { name: 'css-logo-vars' },
    { name: 'css-ellipsis-vars' },
    { name: 'css-background-vars' },
    { name: 'css-brand-loader-size' },
    { name: 'css-legacy-size-fallback' },
    { name: 'css-layout-vars' }
  ];
</script>

<script>
  import { BrandLoader } from 'sui-under-test';
  import { png, svg } from './_kit.js';
  let { name } = $props();
  const box = 'width: 320px; height: 360px; overflow: hidden; border: 1px dashed #94a3b8;';
</script>

{#if name === 'required-only'}
  <div style={box}>
    <BrandLoader brandLogoURL={png} brandText="Juspay" />
  </div>
{:else if name === 'with-sub-text'}
  <div style={box}>
    <BrandLoader brandLogoURL={png} brandText="Juspay" subText="Preparing your checkout" />
  </div>
{:else if name === 'sub-text-empty'}
  <div style={box}>
    <BrandLoader brandLogoURL={png} brandText="Juspay" subText="" />
  </div>
{:else if name === 'sub-text-null'}
  <div style={box}>
    <BrandLoader brandLogoURL={png} brandText="Juspay" subText={null} />
  </div>
{:else if name === 'sub-text-long'}
  <div style={box}>
    <BrandLoader
      brandLogoURL={png}
      brandText="Juspay"
      subText="This is a rather long sub text that should wrap across several lines inside the narrow container"
    />
  </div>
{:else if name === 'brand-text-long'}
  <div style={box}>
    <BrandLoader
      brandLogoURL={png}
      brandText="A very long brand name that will need to wrap in this box"
    />
  </div>
{:else if name === 'brand-text-empty'}
  <div style={box}>
    <BrandLoader brandLogoURL={png} brandText="" subText="Only sub text" />
  </div>
{:else if name === 'svg-logo'}
  <div style={box}>
    <BrandLoader brandLogoURL={svg} brandText="SVG brand" subText="vector" />
  </div>
{:else if name === 'testid'}
  <div style={box}>
    <BrandLoader brandLogoURL={png} brandText="Juspay" testId="brand-a" />
  </div>
{:else if name === 'classes'}
  <div style={box}>
    <BrandLoader brandLogoURL={png} brandText="Juspay" classes="brand-x" />
  </div>
{:else if name === 'embedded-box'}
  <div style="width: 300px; height: 300px; display: flex; border: 1px solid #cbd5e1">
    <BrandLoader brandLogoURL={png} brandText="Flex item" subText="inside flex" />
  </div>
{:else if name === 'embedded-small-box'}
  <div style="width: 160px; height: 200px; overflow: hidden; border: 1px solid #cbd5e1">
    <BrandLoader brandLogoURL={png} brandText="Small" subText="tiny box" />
  </div>
{:else if name === 'on-colored-backdrop'}
  <div style="{box} background: linear-gradient(135deg, #1e3a8a, #9333ea)">
    <BrandLoader brandLogoURL={png} brandText="Juspay" subText="Over a gradient" />
  </div>
{:else if name === 'css-text-vars'}
  <div
    style="{box} --loader-text-color: #b91c1c; --loader-text-font-size: 30px; --loader-text-padding: 4px 0; --loader-text-font: monospace; --loader-sub-text-color: #0369a1; --loader-sub-text-font-size: 16px; --loader-sub-text-margin: 4px;"
  >
    <BrandLoader brandLogoURL={png} brandText="Styled" subText="Styled sub text" />
  </div>
{:else if name === 'css-logo-vars'}
  <div style="{box} --loader-img-width: 100px; --loader-img-height: 100px">
    <BrandLoader brandLogoURL={png} brandText="Big logo" />
  </div>
{:else if name === 'css-ellipsis-vars'}
  <div
    style="{box} --loader-dot-color: #dc2626; --loader-ellipsis-width: 120px; --loader-ellipsis-height: 40px; --loader-ellipsis-div-width: 20px; --loader-ellipsis-div-height: 20px; --loader-ellipsis-div-border-radius: 4px;"
  >
    <BrandLoader brandLogoURL={png} brandText="Dots" />
  </div>
{:else if name === 'css-background-vars'}
  <div style="{box} background: #fde68a">
    <div
      style="--loader-background-color: #1e293b; --loader-backdrop-blur: 0px; --loader-background-border-radius: 24px; --loader-text-color: #f8fafc; --loader-sub-text-color: #cbd5e1; width: 100%; height: 100%"
    >
      <BrandLoader brandLogoURL={png} brandText="Dark panel" subText="rounded" />
    </div>
  </div>
{:else if name === 'css-brand-loader-size'}
  <div
    style="--brand-loader-width: 240px; --brand-loader-height: 240px; border: 1px solid #cbd5e1; width: 300px"
  >
    <BrandLoader brandLogoURL={png} brandText="Sized" />
  </div>
{:else if name === 'css-legacy-size-fallback'}
  <div
    style="--loader-width: 200px; --loader-height: 220px; border: 1px solid #cbd5e1; width: 300px"
  >
    <BrandLoader brandLogoURL={png} brandText="Legacy size" />
  </div>
{:else if name === 'css-layout-vars'}
  <div
    style="{box} --loader-flex-direction: row; --loader-justify-content: flex-start; --loader-align-items: flex-start; --loader-ellipsis-display: none;"
  >
    <BrandLoader brandLogoURL={png} brandText="Row" subText="no dots" />
  </div>
{/if}
