import type { Snippet } from 'svelte';

export type SelectProperties = MandatorySelectProperties &
  OptionalSelectProperties &
  SelectEventProperties;

export type SelectItem = {
  id: string;
  label: string;
};

export type MandatorySelectProperties = {
  items: SelectItem[] | string[];
};

export type OptionalSelectProperties = {
  value?: string[];
  multiple?: boolean;
  showSelectAll?: boolean;
  searchable?: boolean;
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
  subtext?: string;
  bottomContent?: Snippet;
  testId?: string;
  classes?: string;
};

export type SelectEventProperties = {
  onchange?: (value: string[]) => void;
};
