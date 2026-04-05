import type { Snippet } from 'svelte';

export type CardProperties = MandatoryCardProperties & OptionalCardProperties;

export type MandatoryCardProperties = {
  children: Snippet;
};

export type OptionalCardProperties = {
  title?: string;
  description?: string;
  classes?: string;
};
