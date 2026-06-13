import type { Snippet } from 'svelte';

export type BreadcrumbItemData = {
  href: string;
  label: string;
};

export type BreadcrumbItemContext = {
  href: string;
  label: string;
  isLast: boolean;
  index: number;
};

export type BreadcrumbProperties = {
  items: readonly BreadcrumbItemData[];
  item: Snippet<[BreadcrumbItemContext]>;
  ariaLabel: string;
  separator?: Snippet;
  classes?: string;
  testId?: string;
};
