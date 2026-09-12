<script lang="ts">
  import type { LabelProperties } from './properties';

  // `for` can't be a destructured binding name -- it's a reserved word -- so
  // it's pulled in under `htmlFor` and re-emitted as the real `for` attribute
  // below, which is what actually wires up the native label/control
  // association.
  let { for: htmlFor, required = false, children, testId, classes }: LabelProperties = $props();
</script>

<label
  class="label {classes ?? ''}"
  for={htmlFor}
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  {@render children?.()}
  {#if required}
    <span class="required-marker" aria-hidden="true">*</span>
    <span class="sr-only">required</span>
  {/if}
</label>

<style>
  .label {
    display: var(--label-display, inline-flex);
    align-items: var(--label-align-items, center);
    gap: var(--label-gap, 4px);
    font-size: var(--label-font-size, 14px);
    font-weight: var(--label-font-weight, 500);
    color: var(--label-color, #333);
    font-family: var(--label-font-family, inherit);
    cursor: var(--label-cursor, pointer);
  }

  .required-marker {
    color: var(--label-required-color, #d32f2f);
    font-size: var(--label-required-font-size, inherit);
  }

  /* Visually hidden but still read by assistive technology -- same pattern
     Table's caption uses. */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    clip-path: inset(50%);
    white-space: nowrap;
    border-width: 0;
  }
</style>
