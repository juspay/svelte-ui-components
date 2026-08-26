export type TaskStatus = 'pending' | 'running' | 'failed' | 'done';

export type TaskListRow = {
  /** The task/step description. */
  label: string;
  /** A count, file, or command shown after the label. */
  secondary?: string;
  /** Render `secondary` in the mono face (filenames, commands). */
  mono?: boolean;
  /** Current state of the row's status machine. */
  status: TaskStatus;
  /** Failed rows: when set, renders an inline retry button with this text. */
  retryLabel?: string;
};

export type TaskListProperties = MandatoryTaskListProperties & OptionalTaskListProperties;

export type MandatoryTaskListProperties = {
  /** The work-plan rows, host-owned. Append rows or flip `status` in place — the component never invents its own timings. */
  rows: TaskListRow[];
};

export type OptionalTaskListProperties = {
  /** Fires when a failed row's retry button is clicked, with that row's index. */
  onretry?: (index: number) => void;
  testId?: string;
  classes?: string;
};
