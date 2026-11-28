<svelte:options runes={false} />

<script lang="ts" context="module">
  // Used by svelte
  export const prerender = true;
</script>

<script lang="ts">
  import { defaultStatusProperties } from './properties';
  import type { StatusProperties } from './properties';
  import Button from '../Button/Button.svelte';
  import {
    createLegacyEventDispatcher,
    legacyHtml,
    legacySrc,
    legacyText,
    replayBoundProps
  } from '../compat';

  const dispatch = createLegacyEventDispatcher();

  // Exported props
  export let properties: StatusProperties = defaultStatusProperties;

  replayBoundProps({
    properties: () => {
      properties = properties;
    }
  });

  function handleButtonClick() {
    dispatch('buttonClick');
  }
</script>

<div class="background">
  <div class="order-status">
    <div class="status-image">
      <img use:legacySrc={properties.statusIcon} alt="status" />
    </div>
    <div class="status-text">{legacyText(properties.statusText)}</div>
    <div class="status-description">
      <!-- eslint-disable-next-line -->
      {@html legacyHtml(properties.statusDescription)}
    </div>
    {#if properties.buttonProperties !== null}
      <Button properties={properties.buttonProperties} on:click={handleButtonClick} />
    {/if}
  </div>
</div>

<style>
  .status-text {
    font-weight: var(--status-font-weight, 600);
    color: var(--status-description-font-color, #2f3841);
    margin-bottom: 8px;
  }

  .status-description {
    font-weight: var(--status-font-weight, 400);
    color: var(--status-description-font-color, #436484cc);
    padding: 0px 42px;
    margin-bottom: 25px;
  }

  .status-image {
    display: flex;
    margin-bottom: 25px;
  }

  .order-status {
    flex-direction: column;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    font-family: var(--order-font, 'Euclid Circular A');
    font-size: var(--order-font-size, 14px);
    text-align: center;
  }
  @supports ((-webkit-backdrop-filter: none) or (backdrop-filter: none)) {
    .order-status {
      background-color: rgba(255, 255, 255, 0.6);
      -webkit-backdrop-filter: blur(60px);
      backdrop-filter: blur(60px);
    }
  }
</style>
