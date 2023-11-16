<script lang="ts" context="module">
  // Used by svelte
  export const prerender = true;
</script>

<script lang="ts">
  import { defaultBrandLoaderProperties } from './properties';
  import type { BrandLoaderProperties } from './properties';

  // Exported props
  export let properties: BrandLoaderProperties = defaultBrandLoaderProperties;
</script>

<div class="background">
  <div class="loader">
    <img src={properties.brandLogoURL} alt="" />
    <div class="text">{properties.brandText}</div>
    {#if properties.subText}
      <div class="sub-text">{properties.subText}</div>
    {/if}
    <div class="lds-ellipsis">
      <div />
      <div />
      <div />
      <div />
    </div>
  </div>
</div>

<style>
  .background {
    height: var(--loader-background-height);
    width: var(--loader-background-width);
  }

  .loader {
    height: var(--loader-height, 100vh);
    width: var(--loader-width, 100vw);
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }

  .loader img {
    height: 40px;
    width: 71px;
  }

  .text {
    font-size: 22px;
    padding: 16px 0px;
    color: var(--loader-text-color, white);
    font-family: var(--loader-text-font, Euclid Circular A);
  }

  .sub-text {
    font-size: 12px;
    margin-bottom: 16px;
  }

  @supports ((-webkit-backdrop-filter: none) or (backdrop-filter: none)) {
    .background {
      animation: animateBackground 5s ease-in-out infinite normal;
      -webkit-animation: animateBackground 5s ease-in-out infinite normal;
    }

    .loader {
      background-color: var(--loader-background-color, #ffffff33);
      -webkit-backdrop-filter: blur(50px);
      backdrop-filter: blur(50px);
    }
  }

  .lds-ellipsis {
    display: inline-block;
    position: relative;
    width: 80px;
    height: 80px;
  }
  .lds-ellipsis div {
    display: inherit;
    position: absolute;
    top: 5px;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: var(--loader-dot-color, #3a4550);
    animation-timing-function: cubic-bezier(0, 1, 1, 0);
  }
  .lds-ellipsis div:nth-child(1) {
    left: 8px;
    animation: lds-ellipsis1 0.6s infinite;
  }
  .lds-ellipsis div:nth-child(2) {
    left: 8px;
    animation: lds-ellipsis2 0.6s infinite;
  }
  .lds-ellipsis div:nth-child(3) {
    left: 32px;
    animation: lds-ellipsis2 0.6s infinite;
  }
  .lds-ellipsis div:nth-child(4) {
    left: 56px;
    animation: lds-ellipsis3 0.6s infinite;
  }
  @keyframes lds-ellipsis1 {
    0% {
      transform: scale(0);
    }
    100% {
      transform: scale(1);
    }
  }
  @keyframes lds-ellipsis3 {
    0% {
      transform: scale(1);
    }
    100% {
      transform: scale(0);
    }
  }
  @keyframes lds-ellipsis2 {
    0% {
      transform: translate(0, 0);
    }
    100% {
      transform: translate(24px, 0);
    }
  }
</style>
