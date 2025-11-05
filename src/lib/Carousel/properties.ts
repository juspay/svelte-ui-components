import type { Component } from 'svelte';

export type CarouselView = {
  properties?: Record<string, unknown>;
  component: Component<Record<string, unknown>>;
};

export type CarouselProperties = {
  views: CarouselView[];
  autoplay?: boolean;
  autoplayInterval?: number;
  showDots?: boolean;
  isScrollableLast?: boolean;
  onkeydown?: (event: KeyboardEvent) => void;
};
