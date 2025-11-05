import type { Component } from 'svelte';

export type CarouselView<TProps extends Record<string, unknown> = Record<string, unknown>> = {
  properties?: TProps;
  component: Component<TProps>;
};

export type CarouselProperties<TProps extends Record<string, unknown> = Record<string, unknown>> = {
  views: CarouselView<TProps>[];
  autoplay?: boolean;
  autoplayInterval?: number;
  showDots?: boolean;
  isScrollableLast?: boolean;
  onkeydown?: (event: KeyboardEvent) => void;
};
