/**
 * The link between a form control and the text that explains it.
 *
 * `Input` got this right and was the only one: it derives an id per message,
 * composes `aria-describedby` from the messages that are actually on screen, and
 * sets `aria-invalid` only while an error is showing. Across Select, Combobox,
 * ChipInput, SplitInput, Slider, Radio, Checkbox, Toggle, Choicebox, ColorPicker
 * and FileInput there was not one `aria-describedby` and not one `aria-invalid`;
 * DateRangePicker had eight `aria-invalid` and no `aria-describedby` at all, so
 * it could announce that a date was wrong while linking nothing that said why.
 *
 * Two rules are easy to get wrong and are the reason this is shared rather than
 * copied:
 *
 * - **Reference only ids that exist.** `aria-describedby="x-error"` pointing at
 *   an element that is not rendered passes any attribute-presence assertion and
 *   silently resolves to nothing in a real screen reader. So the id is included
 *   only while its message is being rendered, and the caller must render each
 *   message under the same condition.
 * - **`aria-invalid` means invalid now**, not "this control can be invalid". A
 *   control that carries it permanently tells a user every field is broken.
 */

export type FieldMessages = {
  /** Text shown when the control is in error. Empty or null means no error. */
  readonly error?: string | null;
  /** Persistent helper text describing the control. */
  readonly info?: string | null;
  /**
   * Forces the error state on for consumers driving validity from a server or
   * their own rules, independently of any message.
   */
  readonly invalid?: boolean;
};

export type FieldDescription = {
  /** Id for the error element. Render it only when `showsError` is true. */
  readonly errorId: string;
  /** Id for the helper element. Render it only when `showsInfo` is true. */
  readonly infoId: string;
  readonly showsError: boolean;
  readonly showsInfo: boolean;
  /** For `aria-describedby`; null when there is nothing to reference. */
  readonly describedBy: string | null;
  /** For `aria-invalid`; null rather than "false" so the attribute is absent. */
  readonly ariaInvalid: 'true' | null;
};

const hasText = (value: string | null): boolean => typeof value === 'string' && value !== '';

/**
 * @param id The control's own id. Message ids are derived from it so two
 *   controls on one page cannot collide.
 */
export function describeField(id: string, messages: FieldMessages): FieldDescription {
  const errorId = `${id}-error`;
  const infoId = `${id}-info`;
  // An explicit `invalid` with no message still marks the control invalid --
  // that is what forceError means -- but it cannot be described by an element
  // that will not be rendered.
  const showsError = hasText(messages.error ?? null);
  const showsInfo = hasText(messages.info ?? null);
  const referenced: string[] = [];
  if (showsError) {
    referenced.push(errorId);
  }
  if (showsInfo) {
    referenced.push(infoId);
  }
  return {
    errorId,
    infoId,
    showsError,
    showsInfo,
    describedBy: referenced.length > 0 ? referenced.join(' ') : null,
    ariaInvalid: showsError || messages.invalid === true ? 'true' : null
  };
}
