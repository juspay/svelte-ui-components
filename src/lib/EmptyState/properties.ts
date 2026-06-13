import type { Snippet } from 'svelte';

export type EmptyStateProperties = MandatoryEmptyStateProperties & OptionalEmptyStateProperties;

export type MandatoryEmptyStateProperties = {
  title: string;
};

export type OptionalEmptyStateProperties = {
  description?: string;
  icon?: Snippet;
  children?: Snippet;
  classes?: string;
  testId?: string;
};
