<script lang="ts">
  import type { GradientBlurProperties } from './properties';

  let { testId, classes }: GradientBlurProperties = $props();
</script>

<div
  class="gradient-blur {classes ?? ''}"
  aria-hidden="true"
  data-pw={typeof testId === 'string' ? testId : null}
>
  <div class="gradient-blur-layer gradient-blur-layer-1"></div>
  <div class="gradient-blur-layer gradient-blur-layer-2"></div>
  <div class="gradient-blur-layer gradient-blur-layer-3"></div>
  <div class="gradient-blur-layer gradient-blur-layer-4"></div>
  <div class="gradient-blur-layer gradient-blur-layer-5"></div>
  <div class="gradient-blur-layer gradient-blur-layer-6"></div>
  <div class="gradient-blur-layer gradient-blur-layer-7"></div>
  <div class="gradient-blur-layer gradient-blur-layer-8"></div>
</div>

<style>
  .gradient-blur {
    position: var(--gradient-blur-position, absolute);
    left: 0;
    right: 0;
    bottom: 0;
    height: var(--gradient-blur-height, 80px);
    pointer-events: none;
    z-index: var(--gradient-blur-z-index, 10);
  }

  .gradient-blur-layer {
    position: absolute;
    inset: 0;
  }

  .gradient-blur-layer-1 {
    backdrop-filter: blur(calc(var(--gradient-blur-strength, 8px) * 1));
    -webkit-backdrop-filter: blur(calc(var(--gradient-blur-strength, 8px) * 1));
    mask-image: linear-gradient(
      var(--gradient-blur-direction, to bottom),
      rgba(0, 0, 0, 1) 0%,
      rgba(0, 0, 0, 0) 12.5%
    );
  }

  .gradient-blur-layer-2 {
    backdrop-filter: blur(calc(var(--gradient-blur-strength, 8px) * 2));
    -webkit-backdrop-filter: blur(calc(var(--gradient-blur-strength, 8px) * 2));
    mask-image: linear-gradient(
      var(--gradient-blur-direction, to bottom),
      rgba(0, 0, 0, 1) 12.5%,
      rgba(0, 0, 0, 0) 25%
    );
  }

  .gradient-blur-layer-3 {
    backdrop-filter: blur(calc(var(--gradient-blur-strength, 8px) * 3));
    -webkit-backdrop-filter: blur(calc(var(--gradient-blur-strength, 8px) * 3));
    mask-image: linear-gradient(
      var(--gradient-blur-direction, to bottom),
      rgba(0, 0, 0, 1) 25%,
      rgba(0, 0, 0, 0) 37.5%
    );
  }

  .gradient-blur-layer-4 {
    backdrop-filter: blur(calc(var(--gradient-blur-strength, 8px) * 4));
    -webkit-backdrop-filter: blur(calc(var(--gradient-blur-strength, 8px) * 4));
    mask-image: linear-gradient(
      var(--gradient-blur-direction, to bottom),
      rgba(0, 0, 0, 1) 37.5%,
      rgba(0, 0, 0, 0) 50%
    );
  }

  .gradient-blur-layer-5 {
    backdrop-filter: blur(calc(var(--gradient-blur-strength, 8px) * 5));
    -webkit-backdrop-filter: blur(calc(var(--gradient-blur-strength, 8px) * 5));
    mask-image: linear-gradient(
      var(--gradient-blur-direction, to bottom),
      rgba(0, 0, 0, 1) 50%,
      rgba(0, 0, 0, 0) 62.5%
    );
  }

  .gradient-blur-layer-6 {
    backdrop-filter: blur(calc(var(--gradient-blur-strength, 8px) * 6));
    -webkit-backdrop-filter: blur(calc(var(--gradient-blur-strength, 8px) * 6));
    mask-image: linear-gradient(
      var(--gradient-blur-direction, to bottom),
      rgba(0, 0, 0, 1) 62.5%,
      rgba(0, 0, 0, 0) 75%
    );
  }

  .gradient-blur-layer-7 {
    backdrop-filter: blur(calc(var(--gradient-blur-strength, 8px) * 7));
    -webkit-backdrop-filter: blur(calc(var(--gradient-blur-strength, 8px) * 7));
    mask-image: linear-gradient(
      var(--gradient-blur-direction, to bottom),
      rgba(0, 0, 0, 1) 75%,
      rgba(0, 0, 0, 0) 87.5%
    );
  }

  .gradient-blur-layer-8 {
    backdrop-filter: blur(calc(var(--gradient-blur-strength, 8px) * 8));
    -webkit-backdrop-filter: blur(calc(var(--gradient-blur-strength, 8px) * 8));
    mask-image: linear-gradient(
      var(--gradient-blur-direction, to bottom),
      rgba(0, 0, 0, 1) 87.5%,
      rgba(0, 0, 0, 0) 100%
    );
  }
</style>
