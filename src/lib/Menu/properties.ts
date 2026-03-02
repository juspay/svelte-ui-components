import type { Snippet } from 'svelte';

export type MenuItem = {
  label: string;
  value: string;
  icon?: string;
  disabled?: boolean;
  danger?: boolean;
  separator?: boolean;
};

export type MenuProperties = MandatoryMenuProperties & OptionalMenuProperties & MenuEventProperties;

export type MandatoryMenuProperties = {
  items: MenuItem[];
};

export type OptionalMenuProperties = {
  open?: boolean;
  testId?: string;
  trigger?: Snippet;
  classes?: string;
};

export type MenuEventProperties = {
  onselect?: (item: MenuItem) => void;
  onopen?: () => void;
  onclose?: () => void;
};
