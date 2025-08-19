<script lang="ts">
  import Loader from '../Loader/Loader.svelte';
  import type { Snippet } from 'svelte';

  // Local types (cleaned and localized)
  type LoaderType = 'Circular' | 'ProgressBar';

  type ButtonProps = {
    text: string;
    enable: boolean;
    showLoader: boolean;
    loaderType: LoaderType | null;
    type: 'submit' | 'reset' | 'button';
    testId: string;
  };

  type OptionalProps = Partial<{
    properties?: Partial<ButtonProps>;
    showProgressBar?: boolean;
    icon?: Snippet;
    onclick?: (event: MouseEvent) => void;
  }>;

  // Default props
  const defaultButtonProps: ButtonProps = {
    text: 'click',
    enable: true,
    showLoader: false,
    loaderType: null,
    type: 'submit',
    testId: ''
  };

  const rawProps = $props() as OptionalProps;

  const buttonProps: ButtonProps = {
    ...defaultButtonProps,
    ...rawProps.properties
  };

  const icon = rawProps.icon;
  const onclick = rawProps.onclick ?? (() => {});
  const initialShowProgressBar = rawProps.showProgressBar ?? false;
  let showProgressBar = $state(initialShowProgressBar);

  function handleButtonClick(event: MouseEvent) {
    if (showProgressBar) return;
    onclick(event);
    if (buttonProps.showLoader && buttonProps.loaderType === 'ProgressBar') {
      showProgressBar = true;
    }
  }
</script>

<div class="button-container">
  {#if showProgressBar}
    <div class="button-progress-bar"></div>
  {/if}

  <button
    style="
      --opacity: {buttonProps.enable ? 1 : 0.4};
      --cursor: {buttonProps.enable ? 'pointer' : 'not-allowed'};"
    onclick={handleButtonClick}
    disabled={!(buttonProps.enable && !buttonProps.showLoader)}
    type={buttonProps.type}
    data-pw={buttonProps.testId}
  >
    {#if buttonProps.showLoader && buttonProps.loaderType === 'Circular'}
      <div class="button-loader"><Loader /></div>
    {/if}

    {#if icon}
      <div class="button-icon">{icon()}</div>
    {/if}

    {#if buttonProps.text.length > 0}
      <div class="button-text">{buttonProps.text}</div>
    {/if}
  </button>
</div>

<style>
  .button-container {
    position: relative;
    width: var(--button-width, fit-content);
  }
  button {
    max-height: var(--button-max-height);
    max-width: var(--button-max-width);
    font-family: var(--button-font-family);
    font-weight: var(--button-font-weight, 500);
    font-size: var(--button-font-size, 14px);
    background-color: var(--button-color, #3a4550);
    color: var(--button-text-color, white);
    height: var(--button-height, fit-content);
    padding: var(--button-padding, 16px);
    margin: var(--button-margin);
    border-radius: var(--button-border-radius, 0px);
    width: var(--button-width, fit-content);
    cursor: var(--cursor, pointer);
    opacity: var(--opacity, 1);
    border: var(--button-border, none);
    display: flex;
    justify-content: var(--button-justify-content, center);
    align-items: center;
    flex-direction: var(--button-content-flex-direction, row);
    gap: var(--button-content-gap, 16px);
    visibility: var(--button-visibility, visible);
    box-shadow: var(--button-box-shadow, none);
  }

  .button-loader {
    order: var(--button-loader-order, 1);
  }

  .button-icon {
    order: var(--button-icon-order, 2);
    display: var(--button-icon-display);
  }

  .button-text {
    order: var(--button-text-order, 3);
    display: var(--button-text-display);
  }

  button:hover {
    background: var(--button-hover-color, var(--button-color, #3a4550));
    color: var(--button-hover-text-color, var(--button-text-color, white));
    border: var(--button-hover-border, var(--button-border, none));
  }

  .button-progress-bar {
    position: absolute;
    height: 100%;
    width: 100%;
    background: var(--button-progress-loader-background-color, #00000030);
    animation: fill-loader var(--button-progress-loader-duration, 8s) forwards;
    z-index: 2;
  }

  @keyframes fill-loader {
    0% {
      width: 0;
    }

    100% {
      width: 100%;
    }
  }
</style>
