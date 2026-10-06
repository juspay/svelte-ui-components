import type { FieldConfig } from './properties';

type NamedFieldConfig = Pick<FieldConfig, 'ariaLabel' | 'label' | 'dataType' | 'maxLength'>;

export type FieldNameContext = {
  readonly index: number;
  readonly total: number;
  readonly config: NamedFieldConfig;
  /** The group's own name (`SplitInput`'s `ariaLabel`), when it has one. */
  readonly groupLabel?: string;
  readonly positionLabel?: (position: number, total: number) => string;
};

const nonEmpty = (text?: string | null): string | null => {
  const trimmed = typeof text === 'string' ? text.trim() : '';
  return trimmed === '' ? null : trimmed;
};

const capitalise = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * What one box holds, so the position reads as the user experiences it: the boxes
 * of a PIN or one-time code are "digit 2 of 6", the boxes of a free-text code are
 * "character 2 of 6", and anything wider than one character ("192", an area code)
 * is just a "field" -- calling a three-digit octet a digit would be wrong.
 */
const unitFor = (config: NamedFieldConfig): 'digit' | 'character' | 'field' => {
  if (config.maxLength !== 1) {
    return 'field';
  }
  return config.dataType === 'tel' || config.dataType === 'number' ? 'digit' : 'character';
};

/** Capitalised only when nothing precedes it: after "One-time code," it stays lower-case. */
const defaultPosition = (
  config: NamedFieldConfig,
  index: number,
  total: number,
  leading: boolean
): string => {
  const text = `${unitFor(config)} ${index + 1} of ${total}`;
  return leading ? capitalise(text) : text;
};

/**
 * The accessible name for one box of a SplitInput.
 *
 * A box on its own is meaningless -- "edit text, blank", six times -- so each one
 * has to say which field it is. In order of how specific the caller was:
 *
 * 1. `config.ariaLabel`: the caller named this box by purpose ("Red", "Area
 *    code"). Used exactly as given; it already says which field it is.
 * 2. `config.label`: the visible caption under the box ("R"), which is what the
 *    box is already called on screen -- the name has to contain it.
 * 3. Otherwise the box's position: "digit 2 of 6".
 *
 * For 2 and 3 the group's name leads, because a screen reader's form-field list
 * shows each control without its group: "One-time code, digit 2 of 6" is
 * identifiable there, "digit 2 of 6" is not. With no group name the position is
 * all there is, so the group should be named -- see `SplitInput`'s `ariaLabel`.
 */
export const resolveFieldName = ({
  index,
  total,
  config,
  groupLabel,
  positionLabel
}: FieldNameContext): string => {
  const explicit = nonEmpty(config.ariaLabel);
  if (explicit !== null) {
    return explicit;
  }
  const group = nonEmpty(groupLabel);
  const own =
    nonEmpty(config.label) ??
    nonEmpty(positionLabel?.(index + 1, total)) ??
    defaultPosition(config, index, total, group === null);
  return group === null ? own : `${group}, ${own}`;
};
