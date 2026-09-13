export type ToolCallChipState = 'running' | 'done' | 'error';

export type ToolCallChip = {
  /** The tool action, e.g. "Read", "Edit", "Run". */
  label: string;
  /** A filename, command or count shown after the label. */
  meta?: string;
  /** Render `meta` in the mono face (filenames, commands). */
  mono?: boolean;
  /** Chip state: `running` shows a spinner, `error` renders red-toned. */
  state?: ToolCallChipState;
  /** Diff stat: added line count, rendered as a +N pill. */
  added?: number;
  /** Diff stat: removed line count, rendered as a −N pill. */
  removed?: number;
  /** When present, the chip becomes expandable and shows this text in a popover. */
  detail?: string;
};

export type ToolCallLogProperties = MandatoryToolCallLogProperties & OptionalToolCallLogProperties;

export type MandatoryToolCallLogProperties = {
  /** The tool calls made so far this turn — append as they run; new chips stagger in. */
  chips: ToolCallChip[];
};

export type OptionalToolCallLogProperties = {
  onchipclick?: (index: number, chip: ToolCallChip) => void;
  testId?: string;
  classes?: string;
  /**
   * Move the open detail popover out to the root of the tree it lives in, so an
   * `overflow: hidden` or scrolling ancestor between the two — a chat bubble, a
   * card — cannot clip it. Defaults to true, which is what this component did
   * unconditionally before the prop existed. Placement is identical either way
   * (the popover is `position: fixed` in both modes), so turning it off costs
   * only the clipping escape — worth it when the popover must stay inside a
   * container that is itself being transformed or scrolled as a unit.
   */
  usePortal?: boolean;
};
