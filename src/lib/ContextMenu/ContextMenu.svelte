<script lang="ts">
  import { registerDismissible } from '../_interaction/dismissal';
  import type { ContextMenuProperties, ContextMenuItem } from './properties';

  let {
    items,
    open = $bindable(false),
    maxHeight = '240px',
    testId,
    children,
    onselect,
    onopen,
    onclose,
    classes
  }: ContextMenuProperties = $props();

  let menuEl: HTMLDivElement | null = $state(null);
  let containerEl: HTMLDivElement | null = $state(null);
  let focusedIndex: number = $state(-1);
  let posX: number = $state(0);
  let posY: number = $state(0);
  // Captured when the menu opens, consumed once on close — the element that had
  // focus (or triggered the native contextmenu event) is where focus belongs once
  // the menu goes away, matching Menu.svelte's own restore-on-close contract.
  let openerElement: HTMLElement | null = $state(null);

  let selectableItems: ContextMenuItem[] = $derived(
    items.filter((item) => !item.separator && !item.disabled)
  );

  // The frame that moves focus into the freshly-opened menu, kept so closing can
  // cancel it. Escape pressed between the right-click and that frame used to
  // leave the callback queued: it ran after the menu was gone, moved focus onto
  // an item that no longer existed, and left the page with nothing focused at
  // all — worse than never restoring, because the user's place is simply lost.
  let openFrame: number | null = null;

  function cancelOpenFrame() {
    if (openFrame !== null) {
      cancelAnimationFrame(openFrame);
      openFrame = null;
    }
  }

  function openMenu(x: number, y: number) {
    posX = x;
    posY = y;
    open = true;
    focusedIndex = 0;
    onopen?.();
    cancelOpenFrame();
    openFrame = requestAnimationFrame(() => {
      openFrame = null;
      adjustPosition();
      focusItem(0);
    });
  }

  function close() {
    cancelOpenFrame();
    open = false;
    focusedIndex = -1;
    onclose?.();

    const opener = openerElement;
    openerElement = null;
    if (opener === null) {
      return;
    }

    // Only take focus back if nothing else has claimed it. Closing by clicking a
    // focusable element outside means the browser has already moved focus there,
    // and pulling it back to the opener would fight the user and lose their
    // place. Focus still inside the dying menu, or fallen to <body>, is loose and
    // does belong to the opener.
    const active = document.activeElement;
    const focusIsLoose =
      active === null || active === document.body || (menuEl?.contains(active) ?? false);
    if (focusIsLoose) {
      opener.focus();
    }
  }

  function selectMenuItem(item: ContextMenuItem) {
    if (item.disabled) {
      return;
    }
    onselect?.(item);
    close();
  }

  function adjustPosition() {
    if (menuEl === null) {
      return;
    }
    const rect = menuEl.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (posX + rect.width > viewportWidth) {
      posX = viewportWidth - rect.width - 4;
    }
    if (posY + rect.height > viewportHeight) {
      posY = viewportHeight - rect.height - 4;
    }
    if (posX < 0) {
      posX = 4;
    }
    if (posY < 0) {
      posY = 4;
    }
  }

  function focusItem(index: number) {
    if (menuEl === null) {
      return;
    }
    const focusableItems = menuEl.querySelectorAll<HTMLElement>(
      '[role="menuitem"]:not([aria-disabled="true"])'
    );
    if (index >= 0 && index < focusableItems.length) {
      focusableItems[index].focus();
    }
  }

  function getSelectableIndex(item: ContextMenuItem): number {
    return selectableItems.indexOf(item);
  }

  function handleContextMenu(event: MouseEvent) {
    event.preventDefault();
    // A right-click usually leaves <body> as the active element, and "restore
    // focus to <body>" is not a restoration — it is the same as doing nothing,
    // but it also discards whatever the browser would have done. Capture only a
    // real element.
    const active = document.activeElement;
    openerElement = active instanceof HTMLElement && active !== document.body ? active : null;
    openMenu(event.clientX, event.clientY);
  }

  function handleMenuKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const next = focusedIndex + 1;
        focusedIndex = next >= selectableItems.length ? 0 : next;
        focusItem(focusedIndex);
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const prev = focusedIndex - 1;
        focusedIndex = prev < 0 ? selectableItems.length - 1 : prev;
        focusItem(focusedIndex);
        break;
      }
      case 'Home': {
        event.preventDefault();
        focusedIndex = 0;
        focusItem(focusedIndex);
        break;
      }
      case 'End': {
        event.preventDefault();
        focusedIndex = selectableItems.length - 1;
        focusItem(focusedIndex);
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < selectableItems.length) {
          selectMenuItem(selectableItems[focusedIndex]);
        }
        break;
      }
      case 'Tab': {
        close();
        break;
      }
    }
  }

  /**
   * Registers this dropdown as the topmost dismissible layer for exactly the
   * span it is open (the `{#if open}` block below), and releases it again on
   * teardown. Escape and outside-click used to be answered here directly (a
   * document click listener and a document keydown listener, both added in
   * onMount) — routed through the shared module instead so only the topmost
   * open surface, not every one of them, answers a given press.
   *
   * The module still listens for Escape on the document rather than only on
   * the menu, preserving the reason this component used to as well: for one
   * frame after the right-click the menu is open but focus has not moved into
   * it yet (see openMenu's requestAnimationFrame above). A menu-only handler
   * would do nothing during that window — the keystroke swallowed, the menu
   * still open, and the pending frame then pulling focus into it — so a quick
   * Escape appeared to do the opposite of what it asked for. An open menu has
   * to close on Escape wherever focus happens to be.
   */
  function dismissalAction(_node: HTMLDivElement) {
    const release = registerDismissible({
      element: () => menuEl,
      onEscape: close,
      onOutside: close
    });
    return {
      destroy: release
    };
  }
</script>

<div
  class="context-menu-container {classes ?? ''}"
  bind:this={containerEl}
  oncontextmenu={handleContextMenu}
  {...open ? { role: 'application' } : {}}
  data-pw={testId}
  testID={testId}
>
  {#if typeof children === 'function'}
    {@render children()}
  {/if}
</div>

{#if open}
  <div
    class="context-menu-dropdown"
    style="left: {posX}px; top: {posY}px; --context-menu-max-height: {maxHeight};"
    bind:this={menuEl}
    role="menu"
    tabindex="-1"
    onkeydown={handleMenuKeydown}
    use:dismissalAction
  >
    {#each items as item (item.value)}
      {#if item.separator}
        <div class="context-menu-separator" role="separator"></div>
      {:else}
        <div
          class="context-menu-item"
          class:context-menu-item-danger={item.danger}
          class:context-menu-item-disabled={item.disabled}
          role="menuitem"
          tabindex={item.disabled ? -1 : 0}
          aria-disabled={item.disabled ? 'true' : null}
          onclick={() => selectMenuItem(item)}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              selectMenuItem(item);
            }
          }}
          onfocus={() => {
            if (!item.disabled) {
              focusedIndex = getSelectableIndex(item);
            }
          }}
          data-pw={testId ? `${testId}-item-${item.value}` : null}
          testID={testId ? `${testId}-item-${item.value}` : null}
        >
          {#if item.icon}
            <img class="context-menu-item-icon" src={item.icon} alt="" />
          {/if}
          <span class="context-menu-item-label">{item.label}</span>
          {#if item.shortcut}
            <span class="context-menu-item-shortcut">{item.shortcut}</span>
          {/if}
        </div>
      {/if}
    {/each}
  </div>
{/if}

<style>
  .context-menu-container {
    display: var(--context-menu-container-display, contents);
  }

  .context-menu-dropdown {
    position: fixed;
    z-index: var(--context-menu-z-index, 1000);
    background-color: var(--context-menu-background-color, #ffffff);
    border: var(--context-menu-border, 1px solid #e0e0e0);
    border-radius: var(--context-menu-border-radius, var(--radius, 4px));
    box-shadow: var(--context-menu-box-shadow, 0px 4px 16px rgba(0, 0, 0, 0.12));
    min-width: var(--context-menu-min-width, 160px);
    max-height: var(--context-menu-max-height, 240px);
    overflow-y: auto;
    padding: var(--context-menu-padding, 4px 0);
    font-family: var(--context-menu-font-family, inherit);
    font-size: var(--context-menu-font-size, 14px);
  }

  .context-menu-item {
    display: flex;
    align-items: center;
    padding: var(--context-menu-item-padding, 8px 12px);
    cursor: pointer;
    color: var(--context-menu-item-color, #333333);
    background-color: var(--context-menu-item-background-color, transparent);
    gap: var(--context-menu-item-gap, 8px);
    white-space: var(--context-menu-item-white-space, nowrap);
    -webkit-tap-highlight-color: transparent;
  }

  .context-menu-item:hover {
    background-color: var(--context-menu-item-hover-background-color, #f5f5f5);
    color: var(--context-menu-item-hover-color, var(--context-menu-item-color, #333333));
  }

  .context-menu-item:focus {
    background-color: var(--context-menu-item-focus-background-color, #f0f0f0);
    outline: var(--context-menu-item-focus-outline, none);
  }

  .context-menu-item-danger {
    color: var(--context-menu-item-danger-color, #dc3545);
  }

  .context-menu-item-danger:hover {
    background-color: var(--context-menu-item-danger-hover-background-color, #fff0f0);
    color: var(
      --context-menu-item-danger-hover-color,
      var(--context-menu-item-danger-color, #dc3545)
    );
  }

  .context-menu-item-danger:focus {
    background-color: var(--context-menu-item-danger-focus-background-color, #fff0f0);
  }

  .context-menu-item-disabled {
    opacity: var(--context-menu-item-disabled-opacity, 0.4);
    cursor: var(--context-menu-item-disabled-cursor, not-allowed);
    pointer-events: none;
  }

  .context-menu-separator {
    height: var(--context-menu-separator-height, 1px);
    background-color: var(--context-menu-separator-color, #e0e0e0);
    margin: var(--context-menu-separator-margin, 4px 0);
  }

  .context-menu-item-icon {
    height: var(--context-menu-item-icon-height, 16px);
    width: var(--context-menu-item-icon-width, 16px);
    flex-shrink: 0;
  }

  .context-menu-item-label {
    flex: 1;
    font-weight: var(--context-menu-item-font-weight, 400);
    line-height: var(--context-menu-item-line-height, 1.4);
  }

  .context-menu-item-shortcut {
    color: var(--context-menu-item-shortcut-color, #999999);
    font-size: var(--context-menu-item-shortcut-font-size, 12px);
    font-weight: var(--context-menu-item-shortcut-font-weight, 400);
    margin-left: var(--context-menu-item-shortcut-margin-left, 16px);
  }
</style>
