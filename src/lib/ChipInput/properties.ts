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
  /**
   * Names the draft field for assistive technology. ChipInput renders no visible label of its
   * own, so without this the control reaches the accessibility tree unnamed however the caption
   * beside it reads on screen. Pass the same words as that caption.
   */
  ariaLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  /**
   * Reach for this when a consumer's chips are prone to being ALMOST right -- a misspelled tag,
   * a near-correct email -- and forcing a delete-and-retype round trip for every small correction
   * would be annoying. When `true`, activating a committed chip (click, or Enter/Space once
   * tabbed to it) swaps it for an inline text field pre-filled with its current value: Enter or
   * blurring the field commits the edit back into `values`, Escape restores the original text and
   * leaves `values` untouched. An edit that comes back blank or duplicates another chip is
   * silently discarded, same as a blank/duplicate draft on add. Defaults to `false` -- chips stay
   * display-only and the only way to change one is still to delete it and retype it, unchanged
   * from before this prop existed.
   */
  editable?: boolean;
  testId?: string;
  classes?: string;
};

export type ChipInputEventProperties = {
  onadd?: (value: string) => void;
  /** @deprecated Use `onadd` instead; both work until 4.0.0. */
  onAdd?: (value: string) => void;
  ondismiss?: (value: string) => void;
  /** @deprecated Use `ondismiss` instead; both work until 4.0.0. */
  onDismiss?: (value: string) => void;
  /**
   * Fires after an in-place edit (see `editable`) commits a value that actually changed. Not
   * fired when the edit is cancelled (Escape) or committed with the text unchanged.
   */
  onedit?: (value: string, previousValue: string) => void;
  /** @deprecated Use `onedit` instead; both work until 4.0.0. */
  onEdit?: (value: string, previousValue: string) => void;
  /** Fires alongside `onadd`/`ondismiss`/`onedit`, after any of them has already updated `values`. */
  onchange?: (values: string[]) => void;
  /** @deprecated Use `onchange` instead; both work until 4.0.0. */
  onChange?: (values: string[]) => void;
};
