import type { Snippet } from 'svelte';

export type ThinkingIndicatorVariant = 'default' | 'bare' | 'chip';

export type ThinkingIndicatorKind = 'steps' | 'reasoning' | 'search' | 'coding';

export type ThinkingIndicatorTraceRow = {
  /** The step, sentence, source title, or file action. */
  primary: string;
  /** A count, domain, filename or command shown after the primary text. */
  secondary?: string;
  /** Render `secondary` in the mono face (filenames, commands). */
  mono?: boolean;
  /** Coding rows: added line count, rendered as a +N stat. */
  added?: number;
  /** Coding rows: removed line count, rendered as a −N stat. */
  removed?: number;
  /** Search rows: renders the row as a link that opens in a new tab. */
  href?: string;
};

export type ThinkingIndicatorProperties = OptionalThinkingIndicatorProperties &
  MandatoryThinkingIndicatorProperties;

export type MandatoryThinkingIndicatorProperties = {
  label: string;
};

export type OptionalThinkingIndicatorProperties = {
  /**
   * Reasoning text. Providing one (or `rows`) makes the indicator an expandable
   * disclosure. Ignored in favour of `rows` when both are present.
   */
  detail?: string;
  /** Bindable disclosure state — meaningful only when `detail` or `rows` is set. */
  expanded?: boolean;
  /**
   * `bare` renders only the shimmering label — for chat bubbles where the surrounding
   * UI already supplies the avatar and layout. `chip` renders a self-contained pill
   * (bordered, shadowed, its own background) for a live status floating above other
   * content, e.g. a tool-call indicator above a composer — pass `busy={false}` for a
   * static (non-shimmering) label, matching a plain status badge. Neither `bare` nor
   * `chip` ever becomes expandable.
   */
  variant?: ThinkingIndicatorVariant;
  /**
   * Renders an elapsed `Ns` counter while the label is live. Starts at 0 when a busy
   * phase begins, ticks every second, and freezes at its final value once the label
   * settles (driven by `busy` when set, otherwise by the legacy status-line/detail
   * shape). No effect on the `bare` or `chip` variants.
   */
  showElapsed?: boolean;
  onToggle?: () => void;
  /** Leading indicator. Falls back to the built-in `Loader` spinner. */
  avatar?: Snippet;
  /** Disclosure chevron. Falls back to a built-in chevron that rotates on expand. */
  toggleIcon?: Snippet;
  testId?: string;
  /** Override the toggle button's test id (default: `<testId>-toggle`). */
  toggleTestId?: string;
  /** Override the detail text's test id (default: `<testId>-detail`). */
  detailTestId?: string;
  /** Test id for the status label itself (none by default). */
  labelTestId?: string;
  classes?: string;

  /**
   * The rows revealed so far for a kind-aware reasoning trace — append as the model
   * streams; newly appended rows stagger in. When present (even as `[]`) the
   * Accordion body renders the `kind` row renderer INSTEAD of the `detail`
   * paragraph, and the indicator becomes expandable even without a `detail` string.
   */
  rows?: ThinkingIndicatorTraceRow[];
  /** Which trace row renderer `rows` gets: checklist, prose, sources, or file edits. */
  kind?: ThinkingIndicatorKind;
  /**
   * Host-owned turn state. While `true`: the label shimmers, the `steps` kind's
   * newest row shows a live spinner, the elapsed counter ticks, and the disclosure
   * auto-opens. Flipping it to `false` freezes the elapsed counter, fires
   * `onsettled` exactly once, and — unless a user has toggled the disclosure by
   * hand — schedules the automatic collapse after `collapseDelayMs`. Omit it
   * entirely to get exactly today's released behaviour (manual toggling only).
   */
  busy?: boolean;
  /** Search kind: the query rendered as a chip above the source rows. */
  query?: string;
  /** Search kind: settled trailing caption, e.g. "+7 more". */
  moreLabel?: string;
  /** Coding kind: rows become toggle buttons and report selection. */
  selectable?: boolean;
  /** Bindable index of the selected coding row (`null` = none). */
  selected?: number | null;
  onrowselect?: (index: number | null) => void;
  /** Fires exactly once, the moment `busy` flips false. No effect while `busy` is never set. */
  onsettled?: () => void;
  /**
   * Delay (ms) before the automatic post-settle collapse fires once `busy` flips
   * false. `null` disables the automatic collapse. Has no effect while `busy` is
   * never passed, or once the disclosure has been toggled by hand.
   */
  collapseDelayMs?: number | null;
};
