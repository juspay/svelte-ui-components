<script lang="ts">
  import { onDestroy, tick } from 'svelte';
  import { focusEntryPoint, focusTrapTabTarget, getActiveElement } from '../_interaction/focus';
  import { acquireScrollLock } from '../utils';
  import { isTopmostDismissible, registerDismissible } from '../_interaction/dismissal';
  import type { DialogProperties } from './properties';

  let {
    open = $bindable(false),
    modal = true,
    lockScroll = true,
    returnFocusTo,
    element = $bindable(),
    classes,
    testId,
    nativeAttrs,
    children,
    onclose,
    oncancel,
    onclick,
    onkeydown
  }: DialogProperties = $props();

  let opener: HTMLElement | null = null;

  // A real native browser API must run after mount; an open attribute would
  // create a non-modal dialog and lose top-layer focus/background isolation.
  // eslint-disable-next-line no-restricted-syntax
  $effect(() => {
    if (!element) {
      return;
    }
    const dialog = element;
    const releaseLayer = open ? registerDismissible({ element: () => dialog }) : null;
    if (open && !dialog.open) {
      const active = getActiveElement(dialog);
      opener = active instanceof HTMLElement ? active : null;
      try {
        if (modal) {
          dialog.showModal();
        } else {
          dialog.show();
        }
      } catch (error) {
        releaseLayer?.();
        throw error;
      }
      void tick().then(() => {
        const active = getActiveElement(dialog);
        if (
          dialog.open &&
          isTopmostDismissible(dialog) &&
          !dialog.hasAttribute('autofocus') &&
          (active === dialog || active === null || active === dialog.ownerDocument.body)
        ) {
          // Firefox/WebKit do not initially focus projected light-DOM controls.
          // Keep a browser-selected descendant, including an autofocus target.
          focusEntryPoint(dialog, true);
        }
      });
    } else if (!open && dialog.open) {
      dialog.close();
    }
    if (releaseLayer) {
      return releaseLayer;
    }
  });

  // eslint-disable-next-line no-restricted-syntax
  $effect(() => {
    if (open && modal && lockScroll && element) {
      return acquireScrollLock(element.ownerDocument.body);
    }
  });

  const restoreFocus = () => {
    const target = returnFocusTo ?? opener;
    opener = null;
    if (target?.isConnected) {
      target.focus({ preventScroll: true });
    }
  };

  onDestroy(() => {
    const wasOpen = element?.open ?? false;
    if (wasOpen) {
      element?.close();
      restoreFocus();
    }
  });

  const handleKeydown = (event: KeyboardEvent) => {
    onkeydown?.(event);
    if (
      event.key !== 'Tab' ||
      event.defaultPrevented ||
      !modal ||
      !isTopmostDismissible(element ?? null)
    ) {
      return;
    }
    const target = focusTrapTabTarget({
      container: element ?? null,
      activeElement: getActiveElement(element ?? null),
      shiftKey: event.shiftKey
    });
    if (target) {
      event.preventDefault();
      target.focus();
    }
  };

  const handleCancel = (event: Event) => {
    oncancel?.(event);
    if (!event.defaultPrevented) {
      open = false;
    }
  };

  const handleClose = (event: Event) => {
    if (element?.open) {
      return;
    } // ignore a stale close notification after reopening
    open = false;
    restoreFocus();
    onclose?.(event);
  };
</script>

<!-- The native dialog supplies focus management and modal semantics. Content
     owns its accessible name through nativeAttrs and its own heading/labels. -->
<dialog
  {...nativeAttrs}
  bind:this={element}
  class={classes ?? ''}
  data-pw={testId}
  onkeydown={handleKeydown}
  oncancel={handleCancel}
  onclose={handleClose}
  {onclick}
>
  {@render children?.()}
</dialog>
