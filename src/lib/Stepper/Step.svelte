<script lang="ts">
  import { defaultStepProperties, type StepProperties } from './properties';

  export let properties: StepProperties = defaultStepProperties;
</script>

<div class="step">
  <div
    class={`step-index-container step-index-${properties.status} ${properties.animateClass}-index`}
  >
    <div class={`step-index-text-${properties.status}`}>
      {properties.stepIndex}
    </div>
  </div>
  <div class={`step-text step-text-${properties.status} ${properties.animateClass}-text`}>
    {properties.stepLabel}
  </div>
  {#if properties.showStepLine}
    <div class={`separator separator-${properties.status} ${properties.animateClass}-separator`} />
  {/if}
</div>

<style>
  .step {
    display: flex;
    flex-direction: var(--step-flex-direction, row);
    justify-content: center;
    align-items: center;
  }

  .step-index-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: var(--step-index-height, 30px);
    width: var(--step-index-width, 30px);
    border-radius: 50%;
  }

  .separator {
    height: var(--separator-height, 1px);
    width: var(--separator-width, 50px);
    margin-left: var(--separator-margin, 12px);
    margin-right: var(--separator-margin, 12px);
  }

  .step-text {
    margin-left: var(--step-label-left-margin, 12px);
    font-size: var(--step-label-font-size, 12px);
  }

  /* Completed  Steps */
  .step-index-text-completed {
    font-size: var(--step-index-completed-font-size, 14px);
    color: var(--step-index-completed-font-color, white);
  }

  .step-index-completed {
    background-color: var(--step-index-bg-completed-color, #24aa5a);
  }

  .step-text-completed {
    color: var(--step-text-completed-color, #24aa5a);
  }

  .separator-completed {
    background-image: var(
      --separator-completed,
      repeating-linear-gradient(
        to right,
        var(--separator-completed-color, #24aa5a),
        var(--separator-completed-color, #24aa5a) 6px,
        transparent 6px,
        transparent 10px
      )
    );
  }

  /* Completed  Steps Animation*/
  @keyframes animateCompletedLine {
    from {
      background-image: var(
        --separator-active,
        repeating-linear-gradient(
          to right,
          var(--separator-active-color, #2f3841),
          var(--separator-active-color, #2f3841) 6px,
          transparent 6px,
          transparent 10px
        )
      );
    }
    to {
      background-image: var(
        --separator-completed,
        repeating-linear-gradient(
          to right,
          var(--separator-completed-color, #24aa5a),
          var(--separator-completed-color, #24aa5a) 6px,
          transparent 6px,
          transparent 10px
        )
      );
    }
  }

  .animate-completed-separator {
    background-image: var(
      --separator-completed,
      repeating-linear-gradient(
        to right,
        var(--separator-completed-color, #24aa5a),
        var(--separator-completed-color, #24aa5a) 6px,
        transparent 6px,
        transparent 10px
      )
    );
    animation-name: animateCompletedLine;
    animation-duration: var(--step-animation-duration, 1s);
  }

  @keyframes animateCompletedIndex {
    from {
      background-color: var(--step-index-active-color, #2f3841);
    }
    to {
      background-color: var(--step-index-bg-completed-color, #24aa5a);
    }
  }

  .animate-completed-index {
    background-color: var(--step-index-bg-completed-color, #24aa5a);
    animation-name: animateCompletedIndex;
    animation-duration: var(--step-animation-duration, 1s);
  }

  @keyframes animateCompletedText {
    from {
      color: var(--step-text-active-color, #2f3841);
    }
    to {
      color: var(--step-text-completed-color, #24aa5a);
    }
  }

  .animate-completed-text {
    color: var(--step-text-completed-color, #24aa5a);
    animation-name: animateCompletedText;
    animation-duration: var(--step-animation-duration, 1s);
  }

  /* Active Steps */
  .step-index-active {
    background-color: var(--step-index-active-color, #2f3841);
  }

  .step-text-active {
    color: var(--step-text-active-color, #2f3841);
  }

  .separator-active {
    background-image: var(
      --separator-active,
      repeating-linear-gradient(
        to right,
        var(--separator-active-color, #2f3841),
        var(--separator-active-color, #2f3841) 6px,
        transparent 6px,
        transparent 10px
      )
    );
  }

  .step-index-text-active {
    font-size: var(--step-index-active-font-size, 14px);
    color: var(--step-index-active-font-color, white);
  }

  /* Active Steps Animation */
  @keyframes animateActiveIndex {
    from {
      background-color: var(--step-index-next-color, #798fa5cc);
    }
    to {
      background-color: var(--step-index-active-color, #2f3841);
    }
  }

  .animate-active-index {
    background-color: var(--step-index-active-color, #2f3841);
    animation-name: animateActiveIndex;
    animation-duration: var(--step-animation-duration, 1s);
  }

  @keyframes animateActiveText {
    from {
      color: var(--step-text-next-color, #798fa5cc);
    }
    to {
      color: var(--step-text-active-color, #2f3841);
    }
  }

  .animate-active-text {
    color: var(--step-text-active-color, #2f3841);
    animation-name: animateActiveText;
    animation-duration: var(--step-animation-duration, 1s);
  }

  @keyframes animateActiveLine {
    from {
      background-image: var(
        --separator-next,
        repeating-linear-gradient(
          to right,
          var(--separator-next-color, #798fa5cc),
          var(--separator-next-color, #798fa5cc) 6px,
          transparent 6px,
          transparent 10px
        )
      );
    }
    to {
      background-image: var(
        --separator-active,
        repeating-linear-gradient(
          to right,
          var(--separator-active-color, #2f3841),
          var(--separator-active-color, #2f3841) 6px,
          transparent 6px,
          transparent 10px
        )
      );
    }
  }

  .animate-active-separator {
    background-image: var(
      --separator-active,
      repeating-linear-gradient(
        to right,
        var(--separator-active-color, #2f3841),
        var(--separator-active-color, #2f3841) 6px,
        transparent 6px,
        transparent 10px
      )
    );
    animation-name: animateActiveLine;
    animation-duration: var(--step-animation-duration, 1s);
  }

  /* Next Steps */
  .step-index-next {
    background-color: var(--step-index-next-color, #798fa5cc);
  }

  .step-text-next {
    color: var(--step-text-next-color, #798fa5cc);
  }

  .step-index-text-next {
    font-size: var(--step-index-next-font-size, 14px);
    color: var(--step-index-next-font-color, white);
  }

  .separator-next {
    background-image: var(
      --separator-next,
      repeating-linear-gradient(
        to right,
        var(--separator-next-color, #798fa5cc),
        var(--separator-next-color, #798fa5cc) 6px,
        transparent 6px,
        transparent 10px
      )
    );
  }
</style>
