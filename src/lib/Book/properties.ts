import type { Snippet } from 'svelte';

export type BookPage = {
  content: Snippet;
  title?: string;
};

export type BookTransition = 'slide' | 'fade' | 'none';

export type BookProperties = MandatoryBookProperties & OptionalBookProperties & BookEventProperties;

export type MandatoryBookProperties = {
  pages: BookPage[];
};

export type OptionalBookProperties = {
  currentPage?: number;
  transition?: BookTransition;
  showNavigation?: boolean;
  showPageIndicator?: boolean;
  enableSwipe?: boolean;
  /** Accessible name for the keyboard-operated book region. Defaults to "Book". */
  ariaLabel?: string;
  testId?: string;
  previousIcon?: Snippet;
  nextIcon?: Snippet;
  classes?: string;
};

export type BookEventProperties = {
  onpagechange?: (page: number) => void;
};
