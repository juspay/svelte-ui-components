import type { Snippet } from 'svelte';

export type EmptyStateProperties = MandatoryEmptyStateProperties & OptionalEmptyStateProperties;

export type MandatoryEmptyStateProperties = {
  title: string;
  description: string;
};

export type OptionalEmptyStateProperties = {
  icon?: Snippet;
  children?: Snippet;
  classes?: string;
};
