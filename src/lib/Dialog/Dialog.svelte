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
    // eslint-disable-next-line no-useless-assignment -- Bindable output is assigned by the mounted DOM reference.
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

  let dialogElement = $state<HTMLDialogElement | null>(null);
  const assignDialogElement = (node: HTMLDialogElement | null) => {
    dialogElement = node;
    element = node;
  };
  let opener: HTMLElement | null = null;
  let destroyed = false;
  let focusPending = false;

  // A real native browser API must run after mount; an open attribute would
  // create a non-modal dialog and lose top-layer focus/background isolation.
  // eslint-disable-next-line no-restricted-syntax
  $effect(() => {
    if (!dialogElement) {
      return;
    }
    const dialog = dialogElement;
    const releaseLayer = open ? registerDismissible({ element: () => dialog }) : null;
    if (open && !dialog.open) {
      const active = getActiveElement(dialog);
      opener = active instanceof HTMLElement ? active : null;
      focusPending = true;
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
          !destroyed &&
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
    if (open && modal && lockScroll && dialogElement) {
      return acquireScrollLock(dialogElement.ownerDocument.body);
    }
  });

  const restoreFocus = () => {
    if (!focusPending) {
      return;
    }
    focusPending = false;
    const target = returnFocusTo ?? opener;
    opener = null;
    if (target?.isConnected) {
      target.focus({ preventScroll: true });
    }
  };

  onDestroy(() => {
    destroyed = true;
    const wasOpen = dialogElement?.open ?? false;
    if (wasOpen) {
      dialogElement?.close();
    }
    restoreFocus();
  });

  const handleKeydown = (event: KeyboardEvent) => {
    onkeydown?.(event);
    if (
      event.key !== 'Tab' ||
      event.defaultPrevented ||
      !modal ||
      !isTopmostDismissible(dialogElement)
    ) {
      return;
    }
    const target = focusTrapTabTarget({
      container: dialogElement,
      activeElement: getActiveElement(dialogElement),
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
    if (destroyed || dialogElement?.open) {
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
  bind:this={() => dialogElement, assignDialogElement}
  class={classes ?? ''}
  data-pw={testId}
  onkeydown={handleKeydown}
  oncancel={handleCancel}
  onclose={handleClose}
  {onclick}
>
  {@render children?.()}
</dialog>
