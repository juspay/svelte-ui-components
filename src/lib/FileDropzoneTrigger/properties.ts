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
   * Non-compact: forwarded to the inner `Button`. Compact: applied to the heading `<span>`.
   * Emits both `data-pw` and `testID` on that element.
   */
  testId?: string;
  /** CSS class applied to the root element — the inner `Button` in non-compact, the icon+heading wrapper in compact. */
  classes?: string;
};

export type FileDropzoneTriggerEventProperties = {
  /** Wire to `FileInput`'s `openFilePicker`. Non-compact only — compact relies on `FileInput`'s own whole-area click/drop handling. */
  onclick?: () => void;
};
