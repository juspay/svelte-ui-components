<script module>
  export const cases = [
    { name: 'required-only' },
    { name: 'standalone-value' },
    { name: 'standalone-empty-value' },
    { name: 'standalone-long-value' },
    { name: 'standalone-plus-value' },
    { name: 'mode-count' },
    { name: 'mode-dot-standalone' },
    { name: 'hidden-standalone', allowBlank: true },
    { name: 'hidden-false-standalone' },
    { name: 'image-only' },
    { name: 'image-with-value' },
    { name: 'image-dot' },
    { name: 'image-hidden-badge' },
    { name: 'image-empty-string' },
    { name: 'image-alt' },
    { name: 'image-long-value' },
    { name: 'aria-label-standalone' },
    { name: 'aria-label-dot' },
    { name: 'testid-standalone' },
    { name: 'testid-image' },
    { name: 'classes-standalone' },
    { name: 'classes-image' },
    { name: 'animate-value' },
    { name: 'animate-value-dot' },
    { name: 'animate-value-image' },
    { name: 'standalone-position-var' },
    { name: 'css-vars-standalone' },
    { name: 'css-vars-image' },
    { name: 'image-position-bottom-left' }
  ];
</script>

<script>
  import { Badge } from 'sui-under-test';
  import { png, svg } from './_kit.js';
  let { name } = $props();
</script>

{#if name === 'required-only'}
  <Badge />
{:else if name === 'standalone-value'}
  <Badge value="3" />
{:else if name === 'standalone-empty-value'}
  <Badge value="" />
{:else if name === 'standalone-long-value'}
  <div style="width: 120px">
    <Badge value="A very long badge value that wraps" />
  </div>
{:else if name === 'standalone-plus-value'}
  <Badge value="99+" />
{:else if name === 'mode-count'}
  <Badge value="12" mode="count" />
{:else if name === 'mode-dot-standalone'}
  <Badge value="12" mode="dot" />
{:else if name === 'hidden-standalone'}
  <Badge value="5" hidden />
{:else if name === 'hidden-false-standalone'}
  <Badge value="5" hidden={false} />
{:else if name === 'image-only'}
  <Badge image={png} />
{:else if name === 'image-with-value'}
  <Badge image={png} value="7" />
{:else if name === 'image-dot'}
  <Badge image={svg} mode="dot" />
{:else if name === 'image-hidden-badge'}
  <Badge image={png} value="7" hidden />
{:else if name === 'image-empty-string'}
  <Badge image="" value="7" />
{:else if name === 'image-alt'}
  <Badge image={png} alt="Teal square" value="2" />
{:else if name === 'image-long-value'}
  <Badge image={png} value="12345678901234" />
{:else if name === 'aria-label-standalone'}
  <Badge value="4" ariaLabel="4 unread messages" />
{:else if name === 'aria-label-dot'}
  <Badge mode="dot" ariaLabel="Has updates" />
{:else if name === 'testid-standalone'}
  <Badge value="4" testId="badge-a" />
{:else if name === 'testid-image'}
  <Badge image={png} value="4" testId="badge-b" />
{:else if name === 'classes-standalone'}
  <Badge value="4" classes="extra-x" />
{:else if name === 'classes-image'}
  <Badge image={png} value="4" classes="extra-y" />
{:else if name === 'animate-value'}
  <Badge value="99+" animateValue />
{:else if name === 'animate-value-dot'}
  <Badge mode="dot" value="5" animateValue />
{:else if name === 'animate-value-image'}
  <Badge image={png} value="42" animateValue />
{:else if name === 'standalone-position-var'}
  <div style="position: relative; width: 200px; height: 80px; border: 1px dashed #94a3b8">
    <div style="--badge-standalone-position: absolute; --badge-top: 10px; --badge-right: 20px">
      <Badge value="8" />
    </div>
  </div>
{:else if name === 'css-vars-standalone'}
  <div
    style="--badge-color: #0f172a; --badge-background: #fbbf24; --badge-font-size: 16px; --badge-padding: 6px 14px; --badge-border-radius: 6px; --badge-min-width: 40px; --badge-min-height: 30px; --badge-border: 2px solid #b45309; --badge-font-family: monospace;"
  >
    <Badge value="Hot" />
  </div>
{:else if name === 'css-vars-image'}
  <div
    style="--badge-img-width: 96px; --badge-img-height: 48px; --badge-img-border-radius: 16px; --badge-object-fit: cover; --badge-img-background-color: #e2e8f0; --badge-img-icon-shadow: 0 2px 6px #00000066; --badge-background: #dc2626; --badge-dot-size: 16px; --badge-wrap-margin: 10px; --badge-wrap-padding: 12px;"
  >
    <Badge image={png} mode="dot" />
  </div>
{:else if name === 'image-position-bottom-left'}
  <div style="--badge-top: auto; --badge-right: auto; --badge-bottom: 0; --badge-left: 0">
    <Badge image={png} value="1" />
  </div>
{/if}
