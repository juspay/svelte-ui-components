import type { Component } from 'svelte';

export type CarouselView = {
  properties?: Record<string, unknown>;
  component: Component<Record<string, unknown>>;
};

export type CarouselProperties = CarouselEventProperties &
  OptionalCarouselProperties &
  MandatoryCarouselProperties;

export type MandatoryCarouselProperties = {
  views: CarouselView[];
};
export type OptionalCarouselProperties = {
  autoplay?: boolean;
  autoplayInterval?: number;
  showDots?: boolean;
  isScrollableLast?: boolean;
};

export type CarouselEventProperties = {
  onkeydown?: (event: KeyboardEvent) => void;
};
