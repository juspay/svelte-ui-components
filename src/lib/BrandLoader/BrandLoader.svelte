<script lang="ts">
  import type { BrandLoaderProperties } from './properties';

  let { brandLogoURL, brandText, subText, classes, testId }: BrandLoaderProperties = $props();
</script>

<div class="background {classes ?? ''}" data-pw={typeof testId === 'string' ? testId : null}>
  <div class="loader">
    <img src={brandLogoURL} alt="" />
    <div class="text">{brandText}</div>
    {#if typeof subText === 'string' && subText.length > 0}
      <div class="sub-text">{subText}</div>
    {/if}
    <div class="lds-ellipsis">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  </div>
</div>

<style>
  .background {
    height: var(--loader-background-height);
    width: var(--loader-background-width);
    border-radius: var(--loader-background-border-radius, 0px);
  }

  .loader {
    height: var(--loader-height, 100vh);
    width: var(--loader-width, 100vw);
    border-radius: var(--loader-background-border-radius, 0px);
    display: flex;
    justify-content: var(--loader-justify-content, center);
    align-items: var(--loader-align-items, center);
    flex-direction: var(--loader-flex-direction, column);
  }

  .loader img {
    height: var(--loader-img-height, 40px);
    width: var(--loader-img-width, 71px);
  }

  .text {
    font-size: var(--loader-text-font-size, 22px);
    padding: var(--loader-text-padding, 16px 0px);
    color: var(--loader-text-color, white);
    font-family: var(--loader-text-font, inherit);
  }

  .sub-text {
    font-size: var(--loader-sub-text-font-size, 12px);
    margin: var(--loader-sub-text-margin, 16px);
  }

  @supports ((-webkit-backdrop-filter: none) or (backdrop-filter: none)) {
    .background {
      animation: animateBackground 5s ease-in-out infinite normal;
      -webkit-animation: animateBackground 5s ease-in-out infinite normal;
    }

    .loader {
      background-color: var(--loader-background-color, #ffffff33);
      -webkit-backdrop-filter: blur(var(--loader-webkit-backdrop-filter, 50px));
      backdrop-filter: blur(var(--loader-backdrop-blur, 50px));
    }
  }

  .lds-ellipsis {
    display: var(--loader-ellipsis-display, inline-block);
    position: var(--loader-ellipsis-position, relative);
    width: var(--loader-ellipsis-width, 80px);
    height: var(--loader-ellipsis-height, 80px);
  }
  .lds-ellipsis div {
    display: var(--loader-ellipsis-div-display, inherit);
    position: var(--loader-ellipsis-div-position, absolute);
    top: var(--loader-ellipsis-div-top, 5px);
    width: var(--loader-ellipsis-div-width, 13px);
    height: var(--loader-ellipsis-div-height, 13px);
    border-radius: var(--loader-ellipsis-div-border-radius, 50%);
    background: var(--loader-dot-color, #3a4550);
    animation-timing-function: var(--loader-ellipsis-animation-timing, cubic-bezier(0, 1, 1, 0));
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
