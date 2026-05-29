<script lang="ts">
  import type { LabeledFieldProperties } from './properties';

  let { label, value, testId, classes }: LabeledFieldProperties = $props();
</script>

<div class="labeled-field {classes ?? ''}" data-pw={typeof testId === 'string' ? testId : null}>
  <div class="labeled-field-label">{label}</div>
  <div class="labeled-field-value">{value}</div>
</div>

<style>
  .labeled-field {
    display: flex;
    flex-direction: var(--labeled-field-direction, column);
    gap: var(--labeled-field-gap, 4px);
    align-items: var(--labeled-field-align-items, flex-start);
  }

  .labeled-field-label {
    color: var(--labeled-field-label-color, inherit);
    font-size: var(--labeled-field-label-font-size, 12px);
    font-weight: var(--labeled-field-label-font-weight, 500);
  }

  .labeled-field-value {
    color: var(--labeled-field-value-color, inherit);
    font-size: var(--labeled-field-value-font-size, 14px);
    font-weight: var(--labeled-field-value-font-weight, 400);
  }
</style>
