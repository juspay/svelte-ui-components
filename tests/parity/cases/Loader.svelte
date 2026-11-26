<script module>
  export const cases = [
    { name: 'required-only', allowBlank: true },
    { name: 'default-colored' },
    { name: 'variant-default-explicit' },
    { name: 'variant-border' },
    { name: 'variant-orbit' },
    { name: 'aria-label' },
    { name: 'aria-label-border' },
    { name: 'aria-label-orbit' },
    { name: 'aria-label-empty' },
    { name: 'testid' },
    { name: 'classes' },
    { name: 'all-variants-row' },
    { name: 'css-size' },
    { name: 'css-vars-default' },
    { name: 'css-vars-border' },
    { name: 'css-vars-orbit' },
    { name: 'css-vars-orbit-large-dots' },
    { name: 'on-dark-background' },
    { name: 'inline-in-text' }
  ];
</script>

<script>
  import { Loader } from 'sui-under-test';
  let { name } = $props();
  const fg =
    '--loader-foreground: #0f766e; --loader-foreground-end: #ffffff; --loader-background: #ffffff;';
</script>

{#if name === 'required-only'}
  <Loader />
{:else if name === 'default-colored'}
  <div style={fg}>
    <Loader />
  </div>
{:else if name === 'variant-default-explicit'}
  <div style={fg}>
    <Loader variant="default" />
  </div>
{:else if name === 'variant-border'}
  <Loader variant="border" />
{:else if name === 'variant-orbit'}
  <Loader variant="orbit" />
{:else if name === 'aria-label'}
  <div style={fg}>
    <Loader ariaLabel="Loading data" />
  </div>
{:else if name === 'aria-label-border'}
  <Loader variant="border" ariaLabel="Loading border" />
{:else if name === 'aria-label-orbit'}
  <Loader variant="orbit" ariaLabel="Loading orbit" />
{:else if name === 'aria-label-empty'}
  <Loader variant="border" ariaLabel="" />
{:else if name === 'testid'}
  <Loader variant="border" testId="loader-a" />
{:else if name === 'classes'}
  <Loader variant="border" classes="spin-x" />
{:else if name === 'all-variants-row'}
  <div style="display: flex; gap: 24px; align-items: center; {fg}">
    <Loader />
    <Loader variant="border" />
    <Loader variant="orbit" />
  </div>
{:else if name === 'css-size'}
  <div style="--loader-width: 60px; --loader-height: 60px; --loader-border-radius: 12px; {fg}">
    <Loader />
    <div style="height: 12px"></div>
    <Loader variant="border" />
  </div>
{:else if name === 'css-vars-default'}
  <div
    style="--loader-foreground: #7c3aed; --loader-foreground-end: #fde68a; --loader-background: #ffffff; --loader-width: 48px; --loader-height: 48px; --loader-before-width: 24px; --loader-before-height: 24px; --loader-after-width: 36px; --loader-after-height: 36px; --loader-spin-duration: 2s;"
  >
    <Loader />
  </div>
{:else if name === 'css-vars-border'}
  <div
    style="--loader-active-color: #dc2626; --loader-track-color: #fecaca; --loader-border-width: 6px; --loader-width: 48px; --loader-height: 48px; --loader-spin-duration: 3s;"
  >
    <Loader variant="border" />
  </div>
{:else if name === 'css-vars-orbit'}
  <div
    style="--loader-orbit-primary: #0ea5e9; --loader-orbit-secondary: #f97316; --loader-width: 64px; --loader-height: 64px; --loader-orbit-dot-size: 32px;"
  >
    <Loader variant="orbit" />
  </div>
{:else if name === 'css-vars-orbit-large-dots'}
  <div style="--loader-orbit-dot-radius: 8px; --loader-orbit-dot-size: 20px">
    <Loader variant="orbit" />
  </div>
{:else if name === 'on-dark-background'}
  <div
    style="background: #111827; padding: 24px; display: flex; gap: 24px; --loader-foreground: #f9fafb; --loader-foreground-end: #111827; --loader-background: #111827; --loader-active-color: #f9fafb; --loader-track-color: #374151"
  >
    <Loader />
    <Loader variant="border" />
  </div>
{:else if name === 'inline-in-text'}
  <p style="font-size: 14px">
    Loading <span style="display: inline-block; vertical-align: middle"
      ><Loader variant="border" /></span
    > please wait
  </p>
{/if}
