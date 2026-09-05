import type { CustomValidator, InputDataType, TextTransformer, ValidationState } from '$lib/types';
import type { HTMLInputAttributes } from 'svelte/elements';
import type { Snippet } from 'svelte';

export type InputProperties = OptionalInputProperties &
  InputEventProperties &
  MandatoryInputProperties;

export type MandatoryInputProperties = {
  value: string;
};

export type OptionalInputProperties = {
  placeholder?: string | null;
  dataType?: InputDataType;
  label?: string | null;
  onErrorMessage?: string | null;
  infoMessage?: string | null;
  validators?: CustomValidator[];
  disable?: boolean;
  /**
   * Renders the field read-only: the value can be focused, selected and copied but not
   * edited. Deliberately distinct from `disable`, which also removes the element from
   * the focus order and so cannot serve a select-all-to-copy affordance.
   */
  readonly?: boolean;
  /**
   * Native `spellcheck`. Defaults to `null`, which Svelte renders as "attribute
   * absent", so the browser default is unchanged for every existing consumer.
   * Pass `false` for fields holding code, JSON or identifiers, where red
   * squiggles are noise.
   */
  spellcheck?: boolean | null;
  validationPattern?: RegExp | null;
  inProgressPattern?: RegExp | null;
  addFocusColor?: boolean;
  /**
   * Native `maxlength`. Defaults to 1000. Pass `null` for no limit — a composer or
   * paste target that silently truncates long input is worse than an unbounded one,
   * and the attribute is rendered unconditionally otherwise.
   */
  maxLength?: number | null;
  minLength?: number;
  min?: number;
  max?: number;
  actionInput?: boolean;
  useTextArea?: boolean;
  /** Initial visible rows for the textarea (only applies when `useTextArea`). */
  rows?: number;
  /**
   * Grow/shrink the textarea to fit its content between `minRows` and `maxRows`
   * (only when `useTextArea`). Disables manual resizing while active.
   */
  autoResize?: boolean;
  /** Lower bound (in rows) when `autoResize` is on. Defaults to `rows`. */
  minRows?: number;
  /** Upper bound (in rows) when `autoResize` is on; beyond this the textarea scrolls. */
  maxRows?: number;
  /**
   * Manual resize-handle behaviour for the textarea. Defaults to `'none'` (unchanged from
   * before); forced to `'none'` when `autoResize` is on.
   */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  /** Show a live `current / maxLength` character counter beneath the field. */
  showCount?: boolean;
  autoComplete?: HTMLInputAttributes['autocomplete'];
  /**
   * Virtual-keyboard hint rendered as the native `inputmode` attribute
   * (e.g. `'numeric'` for OTP/PIN fields). Left off by default.
   */
  inputMode?: HTMLInputAttributes['inputmode'];
  name?: string;
  /** Field id, applied to the rendered `<input>`/`<textarea>` so the visible
   *  `<label>` can reference it. Wins over the auto-derived id. Omitting it is
   *  safe: the fallback appends a per-instance suffix from `$props.id()`, so
   *  fields that share a `name` (radio groups, repeated rows) still get unique
   *  ids. Note this names the FIELD, not the wrapper `<div>`. */
  id?: string;
  textTransformers?: TextTransformer[];
  textViewPresentation?: TextTransformer[];
  testId?: string;
  classes?: string;
  role?: string;
  /** Accessible name applied to the native input/textarea (aria-label). */
  ariaLabel?: string | null;
  ariaExpanded?: boolean;
  ariaAutocomplete?: 'none' | 'inline' | 'list' | 'both';
  ariaControls?: string | null;
  ariaActivedescendant?: string | null;
  /** Passive/clickable icon rendered inside the field on the leading edge (e.g. a search icon). */
  leftIcon?: Snippet;
  /** Passive/clickable icon rendered inside the field on the trailing edge (e.g. a clear button). */
  rightIcon?: Snippet;
  /** When set, the leftIcon becomes a focusable button invoking this handler. */
  onlefticonclick?: () => void;
  /** @deprecated Use `onlefticonclick` instead; both work until 4.0.0. */
  onLeftIconClick?: () => void;
  /** When set, the rightIcon becomes a focusable button invoking this handler. */
  onrighticonclick?: () => void;
  /** @deprecated Use `onrighticonclick` instead; both work until 4.0.0. */
  onRightIconClick?: () => void;
  /** Accessible label for the clickable leftIcon button (defaults to a generic label). */
  leftIconLabel?: string;
  /** Accessible label for the clickable rightIcon button (defaults to a generic label). */
  rightIconLabel?: string;
  /** Appends a required asterisk beside the label and sets aria-required on the field. */
  mandatory?: boolean;
  /** Forces the error border independent of validationPattern (server/runtime-driven errors). */
  forceError?: boolean;
};

export type InputEventProperties = {
  oninput?: (value: string, event: Event) => void;
  /** @deprecated Use `oninput` instead; both work until 4.0.0. */
  onInput?: (value: string, event: Event) => void;
  onfocus?: (event: FocusEvent) => void;
  /** @deprecated Use `onfocus` instead; both work until 4.0.0. */
  onFocus?: (event: FocusEvent) => void;
  onfocusout?: (event: FocusEvent) => void;
  /** @deprecated Use `onfocusout` instead; both work until 4.0.0. */
  onFocusout?: (event: FocusEvent) => void;
  onblur?: (event: FocusEvent) => void;
  /** @deprecated Use `onblur` instead; both work until 4.0.0. */
  onBlur?: (event: FocusEvent) => void;
  onpaste?: (event: ClipboardEvent) => void;
  /** @deprecated Use `onpaste` instead; both work until 4.0.0. */
  onPaste?: (event: ClipboardEvent) => void;
  onclick?: (event: MouseEvent) => void;
  /** @deprecated Use `onclick` instead; both work until 4.0.0. */
  onClick?: (event: MouseEvent) => void;
  onstatechange?: (state: ValidationState) => void;
  /** @deprecated Use `onstatechange` instead; both work until 4.0.0. */
  onStateChange?: (state: ValidationState) => void;
  onkeydown?: (event: KeyboardEvent) => void;
  /** @deprecated Use `onkeydown` instead; both work until 4.0.0. */
  onKeyDown?: (event: KeyboardEvent) => void;
};
