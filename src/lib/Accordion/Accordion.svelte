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
    disabled = false,
    panelId
  }: AccordionProperties = $props();

  /* The trigger and the panel are siblings, not ancestor/descendant, so nothing in the
     markup tells assistive technology which region the trigger's aria-expanded refers to.
     A generated id keeps that link automatic -- consumers pass no id and get correct
     wiring -- while `panelId` lets a caller supply their own when they need to reference
     the panel from elsewhere too. */
  const uid = $props.id();
  const effectivePanelId = $derived(panelId ?? `accordion-panel-${uid}`);
  /* The trigger id comes from the same per-instance uid, not from effectivePanelId: a caller
     assigning `panelId` after mount must move the panel's id, not rename the trigger, so the
     control's id stays stable for assistive technology and anything else referencing it. */
  const triggerId = `accordion-trigger-${uid}`;

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
    id={triggerId}
    role="button"
    tabindex={disabled ? -1 : 0}
    aria-expanded={expand}
    aria-controls={effectivePanelId}
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
  id={effectivePanelId}
  role={trigger ? 'region' : null}
  aria-labelledby={trigger ? triggerId : null}
  class="accordion {classes ?? ''}"
  class:expanded={expand}
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
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
    /* overflow: hidden drops this element's automatic minimum size to zero, so
       when it is placed as an item of a consumer's own grid or flex container
       it is otherwise free to be stretched down to whatever size that
       container hands it -- as small as 0px -- independent of how tall its
       own children actually are (issue #550). align-self: start opts the
       panel out of that stretch so it always sizes from its own expanded
       content instead. It is inert when the panel is not a grid or flex item,
       and does not change the collapse animation: collapsed still resolves
       to 0px either way.

       Exposed as --accordion-align-self rather than hardcoded: Svelte's
       scoped class raises .accordion's specificity above a plain utility
       class passed through `classes`, so a consumer who legitimately wants
       the panel stretched (or centered, etc.) could not otherwise override
       this one declaration without reaching for :global() or !important. */
    align-self: var(--accordion-align-self, start);
    transition: grid-template-rows var(--accordion-transition, 0.2s ease-out);
  }

  .accordion.expanded {
    grid-template-rows: 1fr;
  }

  .accordion-content {
    min-height: 0;
  }
</style>
