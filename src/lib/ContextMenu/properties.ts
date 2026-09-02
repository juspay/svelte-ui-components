import type { Snippet } from 'svelte';

export type ContextMenuItem = {
  label: string;
  value: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  separator?: boolean;
};

export type ContextMenuProperties = MandatoryContextMenuProperties &
  OptionalContextMenuProperties &
  ContextMenuEventProperties;

export type MandatoryContextMenuProperties = {
  items: ContextMenuItem[];
};

export type OptionalContextMenuProperties = {
  open?: boolean;
  maxHeight?: string;
  testId?: string;
  children?: Snippet;
  classes?: string;
};

export type ContextMenuEventProperties = {
  onselect?: (item: ContextMenuItem) => void;
  onSelect?: (item: ContextMenuItem) => void;
  onopen?: () => void;
  onOpen?: () => void;
  onclose?: () => void;
  onClose?: () => void;
};
