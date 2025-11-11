import type { Snippet } from 'svelte';

export type BannerProperties = MandatoryBannerProperties &
  OptionalBannerProperties &
  BannerEventProperties;

export type MandatoryBannerProperties = {
  text: string;
};

export type OptionalBannerProperties = {
  icon?: string | null;
  linkText?: string | null;
  rightContent?: Snippet;
};

export type BannerEventProperties = {
  onclick?: (event: MouseEvent) => void;
  onkeydown?: (event: KeyboardEvent) => void;
};
