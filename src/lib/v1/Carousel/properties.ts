import type { SvelteComponent } from 'svelte';

export type CarouselProperties = {
  autoplay: boolean;
  views: { properties: Record<string, unknown> | null; component: typeof SvelteComponent }[];
  autoplayInterval: number;
  showDots: boolean;
  isScrollableLast: boolean;
};

export const defaultCarouselProperties = {
  autoplay: false,
  views: [],
  autoplayInterval: 1000,
  showDots: false,
  isScrollableLast: false
};
