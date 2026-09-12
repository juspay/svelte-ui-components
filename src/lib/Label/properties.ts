import type { Snippet } from 'svelte';

export type LabelProperties = OptionalLabelProperties;

export type MandatoryLabelProperties = Record<string, never>;

export type OptionalLabelProperties = {
  /**
   * Id of the form control this label names. Rendered as the real `for`
   * attribute on a real `<label>` element, so a click anywhere on the label
   * focuses (and, for a checkbox/radio, activates) the control with this id
   * -- the native association a `<span>` styled to look like a label can
   * never give you. Omit it when the label instead wraps its control
   * (implicit association), or has no associated control at all.
   */
  for?: string;
  /**
   * Marks the named field as required. Shown as a visual asterisk, but the
   * asterisk alone is `aria-hidden` -- a screen reader would otherwise either
   * skip it silently or read the bare glyph "asterisk", neither of which says
   * "required". A visually-hidden `"required"` string is rendered alongside
   * it so the requirement is actually announced, not just conveyed by shape.
   */
  required?: boolean;
  /** The label's text/content. */
  children?: Snippet;
  testId?: string;
  classes?: string;
};
