<script lang="ts">
  import type { AccordionProperties } from './properties';

  let {
    expand = $bindable(false),
    children,
    trigger,
    ontoggle,
    triggerClasses,
    classes,
    testId,
    disabled = false
  }: AccordionProperties = $props();

  function handleTriggerClick(): void {
    if (disabled) {
      return;
    }
    expand = !expand;
    ontoggle?.(expand);
  }
</script>

{#if trigger}
  <div
    class="accordion-trigger {triggerClasses ?? ''}"
    class:disabled
    role="button"
    tabindex={disabled ? -1 : 0}
    aria-expanded={expand}
    aria-disabled={disabled}
    onclick={handleTriggerClick}
    onkeydown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleTriggerClick();
      }
    }}
  >
    {@render trigger({ expanded: expand })}
  </div>
{/if}

<div
  class="accordion {classes ?? ''}"
  class:expanded={expand}
  data-pw={typeof testId === 'string' ? testId : null}
>
  <div class="accordion-content">
    {@render children?.()}
  </div>
</div>

<style>
  .accordion-trigger {
    cursor: var(--accordion-trigger-cursor, pointer);
  }

  .accordion-trigger.disabled {
    cursor: var(--accordion-trigger-disabled-cursor, not-allowed);
  }

  .accordion {
    display: grid;
    grid-template-rows: 0fr;
    overflow: hidden;
    transition: grid-template-rows var(--accordion-transition, 0.2s ease-out);
  }

  .accordion.expanded {
    grid-template-rows: 1fr;
  }

  .accordion-content {
    min-height: 0;
  }
</style>
