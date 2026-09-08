import type { FlyParams } from 'svelte/transition';
import type { HTMLAttributes } from 'svelte/elements';

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

/**
 * The strict form of the escape-hatch `attrs` prop: every HTML attribute the
 * component does not manage, and a compile error naming any it does.
 *
 * `attrs` itself is NOT typed this way. It stays `Record<string, string>`,
 * which is what it has always been, so nothing that compiles today stops
 * compiling. Each component instead names its managed keys as `@deprecated`
 * members, which an editor strikes through and
 * `@typescript-eslint/no-deprecated` reports, so the entry is called out where
 * it is written rather than vanishing silently at spread time.
 *
 * Annotate an object with a component's `*StrictAttrs` alias to opt into the
 * compile error today:
 *
 *   const attrs: CardStrictAttrs = { class: 'mine' }; // error: class is managed
 *
 * Optional `never` properties reject managed keys through predeclared objects,
 * not just excess-property checks, and override the broader `data-*` index.
 * Other HTML attributes retain Svelte's native value and event types. `attrs`
 * adopts this shape in the next major — see #576, which specifies the
 * narrowing as a major precisely because rejecting `class` is a break.
 */
export type AttrsEscapeHatch<TManagedKeys extends string> = Omit<
  HTMLAttributes<HTMLElement>,
  TManagedKeys
> & { [Key in TManagedKeys]?: never };

/**
 * The wide `attrs` value type, unchanged from before #576: any attribute name
 * mapped to a string. Intersected with a component's managed-key map so those
 * keys carry a deprecation, which constrains nothing — every managed key is
 * declared optional and `string`-valued, exactly what the index signature
 * already allowed.
 */
export type LegacyAttrs<TManagedAttrs> = Record<string, string> & TManagedAttrs;

export type Rgb = { r: number; g: number; b: number };
export type Hsv = { h: number; s: number; v: number };
export type Hsl = { h: number; s: number; l: number };
