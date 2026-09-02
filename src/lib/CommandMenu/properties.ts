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
  placeholder?: string;
  emptyText?: string;
  testId?: string;
  itemIcon?: Snippet<[CommandItem]>;
  searchIcon?: Snippet;
  classes?: string;
};

export type CommandMenuEventProperties = {
  onselect?: (item: CommandItem) => void;
  onSelect?: (item: CommandItem) => void;
  onclose?: () => void;
  onClose?: () => void;
};
