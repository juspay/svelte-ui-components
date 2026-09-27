import type { Snippet } from 'svelte';

/** What the `row` snippet receives for each rendered item. */
export type WindowedListRow<T> = {
  item: T;
  /** Position in the FULL `items` list, not in the rendered window. */
  index: number;
  /** True for the first rendered item — the one directly under the "show earlier" control. */
  isFirst: boolean;
};

/** What the `earlier` snippet receives when it replaces the default control. */
export type WindowedListEarlier = {
  /** Items above the window that are not rendered. */
  hidden: number;
  /** How many the next reveal adds: `step`, or fewer when fewer are left. */
  next: number;
  /** Renders `next` more above the window, keeping the reader's place. */
  showEarlier: () => void;
};

export type WindowedListProperties<T> = {
  items: T[];
  /** A stable, unique key per item: it drives the keyed render and anchors the window. */
  getKey: (item: T) => string;
  row: Snippet<[WindowedListRow<T>]>;
  /**
   * How many of the newest items render at first. Items appended later join the
   * window at the bottom without pushing earlier ones out, so the window does not
   * slide under a reader.
   */
  initialCount?: number;
  /** How many more each "show earlier" reveals. */
  step?: number;
  /** Replaces the default "show earlier" button. */
  earlier?: Snippet<[WindowedListEarlier]>;
  /** Text of the default button. */
  earlierLabel?: (next: number, hidden: number) => string;
  classes?: string;
  testId?: string;
};
