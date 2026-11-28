<script context="module">
  export const cases = [
    { name: 'default', allowBlank: true },
    { name: 'coloured' },
    { name: 'on-dark' },
    { name: 'gradient-end' },
    { name: 'large' },
    { name: 'small' },
    { name: 'font-and-indent' },
    { name: 'square-radius' },
    { name: 'before-overrides' },
    { name: 'after-overrides' },
    { name: 'style-props' },
    { name: 'two-in-row' },
    { name: 'inside-button-like' }
  ];
</script>

<script>
  import { Loader } from 'sui-v1-under-test';
  export let name;
</script>

{#if name === 'default'}
  <Loader />
{:else if name === 'coloured'}
  <div class="coloured">
    <Loader />
  </div>
{:else if name === 'on-dark'}
  <div
    class="coloured"
    style="background: #111827; padding: 16px; --loader-background: #111827; --loader-foreground: #f9fafb; --loader-foreground-end: #111827"
  >
    <Loader />
  </div>
{:else if name === 'gradient-end'}
  <div
    class="coloured"
    style="--loader-foreground: #be123c; --loader-foreground-end: #fde047; --loader-background: #ffffff"
  >
    <Loader />
  </div>
{:else if name === 'large'}
  <div class="coloured">
    <Loader
      --loader-width="64px"
      --loader-height="64px"
      --loader-before-width="32px"
      --loader-before-height="32px"
      --loader-after-width="48px"
      --loader-after-height="48px"
    />
  </div>
{:else if name === 'small'}
  <div class="coloured">
    <Loader
      --loader-width="10px"
      --loader-height="10px"
      --loader-before-width="5px"
      --loader-before-height="5px"
      --loader-after-width="7px"
      --loader-after-height="7px"
    />
  </div>
{:else if name === 'font-and-indent'}
  <div class="coloured">
    <Loader --loader-font-size="20px" --loader-text-indent="0" />
  </div>
{:else if name === 'square-radius'}
  <div class="coloured">
    <Loader
      --loader-border-radius="4px"
      --loader-before-border-radius="0"
      --loader-after-border-radius="2px"
    />
  </div>
{:else if name === 'before-overrides'}
  <div class="coloured">
    <Loader
      --loader-before-position="relative"
      --loader-before-top="4px"
      --loader-before-left="4px"
      --loader-before-border-radius="50%"
    />
  </div>
{:else if name === 'after-overrides'}
  <div class="coloured">
    <Loader
      --loader-after-margin="2px"
      --loader-after-top="2px"
      --loader-after-left="2px"
      --loader-after-bottom="2px"
      --loader-after-right="2px"
      --loader-after-position="absolute"
      --loader-after-width="10px"
      --loader-after-height="10px"
    />
  </div>
{:else if name === 'style-props'}
  <Loader
    --loader-foreground="#0b6b3a"
    --loader-foreground-end="#bbf7d0"
    --loader-background="#ffffff"
    --loader-width="40px"
    --loader-height="40px"
  />
{:else if name === 'two-in-row'}
  <div class="coloured" style="display: flex; gap: 12px">
    <Loader />
    <Loader --loader-width="30px" --loader-height="30px" />
  </div>
{:else if name === 'inside-button-like'}
  <div
    style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: #1d4ed8; color: white; --loader-foreground: #ffffff; --loader-background: #1d4ed8; --loader-foreground-end: #1d4ed8"
  >
    <Loader />
    <span>Processing</span>
  </div>
{/if}

<style>
  .coloured {
    --loader-foreground: #1d4ed8;
    --loader-foreground-end: #dbeafe;
    --loader-background: #ffffff;
  }
</style>
