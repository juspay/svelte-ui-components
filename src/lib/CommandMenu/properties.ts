import type { Snippet } from 'svelte';

export type CommandItem = {
  label: string;
  value: string;
  group?: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
};

export type CommandMenuProperties = MandatoryCommandMenuProperties &
  OptionalCommandMenuProperties &
  CommandMenuEventProperties;

export type MandatoryCommandMenuProperties = {
  items: CommandItem[];
};

export type OptionalCommandMenuProperties = {
  open?: boolean;
  /** Bindable search text. Omit to keep the built-in uncontrolled search. */
  query?: string;
  /** Disable the built-in global Cmd/Ctrl+K listener when the caller owns shortcuts. */
  shortcutEnabled?: boolean;
  placeholder?: string;
  emptyText?: string;
  testId?: string;
  itemIcon?: Snippet<[CommandItem]>;
  /** Replaces the default icon/label/shortcut row entirely. Receives the item and whether it is the active (arrow-key-highlighted) row. */
  itemSnippet?: Snippet<[CommandItem, boolean]>;
  searchIcon?: Snippet;
  /**
   * Attaches the built-in `Cmd/Ctrl+K` window listener. Default `true`. This
   * listener has no focus or typing guard — it fires from inside a text
   * field or a terminal exactly as it does anywhere else. Set `false` when
   * the hotkey character can legitimately be typed (Ctrl+K is kill-line in
   * a shell) and drive `open` from the consumer's own guarded listener
   * instead; the bindable `open` prop is then the sole control.
   */
  enableHotkey?: boolean;
  /** Mirrors Combobox's filterFn. Default matches `item.label` case-insensitively; a consumer with more than a label to search on (a hint, a path) supplies its own. */
  filterFn?: (item: CommandItem, query: string) => boolean;
  classes?: string;
  /** Accessible name of the dialog. Default `'Command menu'`. */
  ariaLabel?: string;
  /**
   * Default `false`. A controlled parent can set `open = false` without
   * calling the component's own `close()` -- the overlay still unmounts on
   * every close path either way, so `true` clears the typed search query and
   * highlighted index on that unmount too, not only on an internal close.
   * Left off by default so an existing consumer's typed state keeps
   * surviving an externally-controlled close exactly as before.
   */
  clearStateOnClose?: boolean;
};

export type CommandMenuEventProperties = {
  /** Fires on user input and when closing resets a non-empty query. */
  onquerychange?: (query: string) => void;
  onselect?: (item: CommandItem) => void;
  onclose?: () => void;
};
