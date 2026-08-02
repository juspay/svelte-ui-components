export type ChipInputProperties = MandatoryChipInputProperties &
  OptionalChipInputProperties &
  ChipInputEventProperties;

export type MandatoryChipInputProperties = {
  /**
   * The committed chips, in insertion order. Bindable. Dedup-only contract: the component's own
   * commit path (`addChip`) silently drops a value already present, so ChipInput never produces
   * duplicates itself. If a caller assigns a duplicate directly through the binding, dismiss
   * removes only the first matching occurrence rather than every occurrence with that text.
   */
  values: string[];
};

export type OptionalChipInputProperties = {
  placeholder?: string;
  disabled?: boolean;
  testId?: string;
  classes?: string;
};

export type ChipInputEventProperties = {
  onadd?: (value: string) => void;
  ondismiss?: (value: string) => void;
  /** Fires alongside `onadd`/`ondismiss`, after either has already updated `values`. */
  onchange?: (values: string[]) => void;
};
