import type { Snippet } from 'svelte';

export type MasonryGridProperties = {
  columns?: number;
  gap?: string;
  testId?: string;
  classes?: string;
  children?: Snippet;
};
