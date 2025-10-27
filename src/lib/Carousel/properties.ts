import type { SvelteComponent } from 'svelte';

export type CarouselProperties = {
  views: { properties?: Record<string, unknown>; component: typeof SvelteComponent }[];
  autoplay?: boolean;
  autoplayInterval?: number;
  showDots?: boolean;
  isScrollableLast?: boolean;
  onkeydown?: (event: KeyboardEvent) => void;
};
