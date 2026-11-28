<script lang="ts">
  let {
    id,
    text,
    testId,
    alert = false,
    classes
  }: {
    id: string;
    text?: string | null;
    testId: string | null;
    alert?: boolean;
    classes?: string;
  } = $props();
</script>

<div
  {id}
  role={alert ? 'alert' : null}
  class={classes ?? (alert ? 'field-error' : 'field-info')}
  class:sui-field-message-default={typeof classes !== 'string'}
  data-pw={testId}
  testID={testId}
>
  {text}
</div>

<style>
  .field-error:where(.sui-field-message-default) {
    color: var(--field-error-color, #c5120a);
    font-size: var(--field-error-font-size, 12px);
    margin: var(--field-error-margin, 4px 0 0 0);
  }

  .field-info:where(.sui-field-message-default) {
    color: var(--field-info-color, #6b7280);
    font-size: var(--field-info-font-size, 12px);
    margin: var(--field-info-margin, 4px 0 0 0);
  }
</style>
