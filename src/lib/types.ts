import type { FlyParams } from 'svelte/transition';

/**
 * @name InputDataType
 * @description Different types of input data which can be passed to the Input Component.
 *
 * Input renders `<input type={dataType}>`, so this union is the only thing deciding
 * which native types a consumer may ask for. The four added beyond the original
 * text/tel/password/email/number all keep `value` a plain string with no parallel
 * `checked`/`files` model, so Input's existing value plumbing covers them unchanged.
 * `validateInput()` switches on dataType with no default branch, and `number` has
 * always fallen through it unvalidated — these fall through identically.
 *
 * Deliberately NOT included: checkbox and radio (driven by `checked`, which Input has
 * no prop for), and file (rejects scripted `value` writes outright). Those need new
 * props, not a wider union.
 */
export type InputDataType =
  | 'text'
  | 'tel'
  | 'password'
  | 'email'
  | 'number'
  | 'time'
  | 'date'
  | 'search'
  | 'url';

export type ModalTransition = 'IN' | 'ALL';

/**
 * @name CustomValidator
 * @description Function type for taking input parameter and returning a boolean denoting if the value is valid or not
 */

export type CustomValidator = (
  inputValue: string,
  currentValidationState: ValidationState
) => ValidationState;

export type TextTransformer = (text: string) => string;

/**
 * @description Type Map for Possible length values that can be passed to components
 */

/**
 * @description Type Map for All possible output of an Input Filed Validation
 */
export type ValidationState = 'Valid' | 'InProgress' | 'Invalid';

/**
 * @description Type for animation configuration
 */
export type FlyAnimationConfig = {
  in: FlyParams;
  out: FlyParams;
};

export type Rgb = { r: number; g: number; b: number };
export type Hsv = { h: number; s: number; v: number };
export type Hsl = { h: number; s: number; l: number };
