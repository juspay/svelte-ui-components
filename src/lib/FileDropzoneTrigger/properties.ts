export type FileDropzoneTriggerProperties = MandatoryFileDropzoneTriggerProperties &
  OptionalFileDropzoneTriggerProperties &
  FileDropzoneTriggerEventProperties;

export type MandatoryFileDropzoneTriggerProperties = {
  /** Upload icon asset, rendered through the library `Img` component. */
  icon: string;
  /** Primary call-to-action text (static copy, or a dynamic file name once selected). */
  heading: string;
};

export type OptionalFileDropzoneTriggerProperties = {
  /** Secondary line below the heading (accepted file type / size limit). Non-compact only. */
  caption?: string;
  /** Bare icon + heading with no Button wrapper or caption, for inline/compact trigger placements. */
  compact?: boolean;
  /**
   * Non-compact: forwarded to the inner `Button` when this trigger renders one, otherwise applied to the
   * non-interactive surface. Compact: applied to the heading `<span>`. Emits both `data-pw` and `testID`
   * on that element.
   */
  testId?: string;
  /** CSS class applied to the root element — the `Button` (or, inside a `FileInput` region, the non-interactive surface that replaces it) in non-compact, the icon+heading wrapper in compact. */
  classes?: string;
};

export type FileDropzoneTriggerEventProperties = {
  /**
   * Makes the non-compact trigger a real `Button` that owns the action. Use it where nothing else does:
   * standalone, or under `<FileInput activation="trigger">` with `onclick={openFilePicker}`.
   *
   * Inside a default `FileInput` the region already owns activation (one Tab stop; Enter, Space and a
   * click open the chooser), so the trigger renders the same surface as plain content instead of a
   * second button and does not call this handler: the region opens the picker. An existing
   * `onclick={openFilePicker}` there therefore still works, without the duplicate control.
   * Compact never renders a button.
   */
  onclick?: () => void;
};
