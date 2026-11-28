<script context="module">
  export const cases = [
    { name: 'default' },
    { name: 'explicit-null' },
    { name: 'png-value' },
    { name: 'svg-value' },
    { name: 'value-empty' },
    { name: 'value-long' },
    { name: 'value-text' },
    {
      name: 'image-empty-src',
      knownDifference:
        "an image with no source shows Chrome's broken-image icon instead of an empty frame (Svelte 5 builds markup in an inert template document; see docs/V1_COMPAT.md)"
    },
    { name: 'two-in-row' },
    { name: 'themed' },
    { name: 'style-props' },
    { name: 'position-bottom-left' },
    { name: 'image-fit-and-shadow' },
    { name: 'wrap-spacing' }
  ];
</script>

<script>
  import { Badge } from 'sui-v1-under-test';
  import { png, svg } from './_kit.js';
  export let name;
</script>

{#if name === 'default'}
  <Badge />
  <p>after</p>
{:else if name === 'explicit-null'}
  <Badge properties={null} />
  <p>after</p>
{:else if name === 'png-value'}
  <Badge properties={{ image: png, value: '3' }} />
{:else if name === 'svg-value'}
  <Badge properties={{ image: svg, value: '12' }} />
{:else if name === 'value-empty'}
  <Badge properties={{ image: png, value: '' }} />
{:else if name === 'value-long'}
  <Badge properties={{ image: png, value: '99,999+' }} />
{:else if name === 'value-text'}
  <Badge properties={{ image: svg, value: 'NEW' }} />
{:else if name === 'image-empty-src'}
  <Badge properties={{ image: '', value: '1' }} />
{:else if name === 'two-in-row'}
  <div style="display: flex">
    <Badge properties={{ image: png, value: '1' }} />
    <Badge properties={{ image: svg, value: '22' }} />
  </div>
{:else if name === 'themed'}
  <div class="themed">
    <Badge properties={{ image: png, value: '7' }} />
  </div>
{:else if name === 'style-props'}
  <Badge
    properties={{ image: svg, value: '5' }}
    --badge-color="#111827"
    --badge-background="#fde047"
    --badge-font-size="16px"
    --badge-font-family="monospace"
    --badge-padding="4px 10px"
    --badge-border-radius="6px"
    --badge-min-width="20px"
    --badge-min-height="20px"
    --badge-border="2px solid #111827"
  />
{:else if name === 'position-bottom-left'}
  <Badge
    properties={{ image: png, value: '8' }}
    --badge-top="auto"
    --badge-right="auto"
    --badge-bottom="0px"
    --badge-left="0px"
  />
{:else if name === 'image-fit-and-shadow'}
  <Badge
    properties={{ image: svg, value: '2' }}
    --badge-img-border-radius="50%"
    --badge-img-width="80px"
    --badge-img-height="40px"
    --badge-object-fit="cover"
    --badge-img-icon-shadow="0 0 0 3px #1d4ed8"
    --badge-img-background-color="#dbeafe"
  />
{:else if name === 'wrap-spacing'}
  <div style="border: 1px solid #111827; display: inline-block">
    <Badge
      properties={{ image: png, value: '4' }}
      --badge-wrap-margin="0px"
      --badge-wrap-padding="16px"
    />
  </div>
{/if}

<style>
  .themed {
    --badge-wrap-margin: 4px;
    --badge-wrap-padding: 12px;
    --badge-color: #fff7ed;
    --badge-background: #c2410c;
    --badge-font-size: 14px;
    --badge-padding: 3px 9px;
    --badge-border-radius: 12px;
    --badge-min-width: 14px;
    --badge-min-height: 14px;
    --badge-border: 1px solid #7c2d12;
    --badge-top: -4px;
    --badge-right: -4px;
    --badge-img-border-radius: 12px;
    --badge-img-width: 56px;
    --badge-img-height: 56px;
    --badge-object-fit: fill;
    --badge-img-icon-shadow: 0 2px 6px #00000055;
    --badge-img-background-color: #fff;
  }
</style>
