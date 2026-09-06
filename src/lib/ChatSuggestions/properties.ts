import type { Snippet } from 'svelte';

/**
 * A suggestion chip.
 *
 * `label` is what the merchant reads; `value` is what gets dispatched. They are
 * separate because a short call-to-action ("Refund trends") usually stands in for
 * a much longer query, and sending the label would send the wrong thing.
 */
export type ChatSuggestion =
  | string
  | {
      label: string;
      value?: string;
      /** Leading mark for the chip — an image or SVG *URL* (rendered via Img with
       * inlineSvg). For raw markup or custom rendering, use the `icon` snippet. */
      icon?: string;
      /** Hover/long-press text. Defaults to `value` when that differs from `label`. */
      hint?: string;
    };

/**
 * How the chips are arranged.
 *
 * `wrap` flows them onto as many lines as needed — right for a roomy panel.
 * `scroll` keeps them on one line inside a draggable scroller — right for a
 * composer on a phone, where wrapping would push the input off-screen.
 */
export type ChatSuggestionsLayout = 'wrap' | 'scroll';

export type ChatSuggestionsDirection = 'horizontal' | 'vertical';

export type ChatSuggestionsProperties = OptionalChatSuggestionsProperties &
  ChatSuggestionsEventProperties &
  MandatoryChatSuggestionsProperties;

export type MandatoryChatSuggestionsProperties = {
  items: ChatSuggestion[];
};

export type OptionalChatSuggestionsProperties = {
  disabled?: boolean;
  layout?: ChatSuggestionsLayout;
  direction?: ChatSuggestionsDirection;
  /** Render at most this many chips. Omit to render every item. */
  maxVisible?: number;
  /**
   * Suppresses the whole row without unmounting it — for the window between asking
   * and answering, where stale suggestions would invite a second wrong question.
   */
  loading?: boolean;
  /** Custom mark per chip; receives the item's resolved icon string, or null. */
  icon?: Snippet<[string | null, number]>;
  testId?: string;
  classes?: string;
  /**
   * Class string placed on EVERY chip wrapper.
   *
   * A consuming app usually keeps its chip appearance in a central stylesheet keyed on
   * its own class name. Without a hook the library's own wrapper is the only thing in
   * the tree, those central rules never match, and the chips silently fall back to the
   * library's neutral defaults — which is a regression, not a theme.
   */
  chipClasses?: string;
};

export type ChatSuggestionsEventProperties = {
  onselect?: (value: string, index: number) => void;
};
