import type { Snippet } from 'svelte';

export type LoaderType = 'Circular' | 'ProgressBar';

/** Visual style of the button. Maps to a built-in palette via `--button-*` variables. */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'brand';

/** Size preset controlling padding/height/font-size. */
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProperties = OptionalButtonProperties & ButtonEventProperties;

export type OptionalButtonProperties = {
  text?: string;
  /**
   * Visual style: `primary` (default, filled), `secondary` (outlined), `ghost`
   * (transparent), `destructive` (danger), `brand` (transparent chassis for gradient CTAs —
   * pair with a `--button-background` gradient). Each maps to the `--button-*` variables, so an
   * explicit `--button-color` / `classes` override always wins over the variant default.
   */
  variant?: ButtonVariant;
  /** Size preset: `sm` / `md` (default) / `lg`. Controls padding, height, and font size. */
  size?: ButtonSize;
  /** Square padding for an icon-only button. Pair with `ariaLabel` for accessibility. */
  iconOnly?: boolean;
  /** Stretch the button to the full width of its container. */
  fullWidth?: boolean;
  /**
   * Render the button as an `<a>` styled identically. Use for button-styled links/navigation.
   * When set, `type` is ignored; a disabled link is rendered inert via `aria-disabled`.
   */
  href?: string;
  /** Anchor target (only with `href`), e.g. `_blank`. */
  target?: string;
  /** Anchor rel (only with `href`). Defaults to `noopener noreferrer` when `target="_blank"`. */
  rel?: string;
  /**
   * Show a loading state: renders the circular loader, sets `aria-busy`, and disables the
   * button. Preferred over the legacy `showLoader`/`loaderType` pair.
   */
  loading?: boolean;
  /**
   * Render the `text` as raw HTML. Defaults to `false` (safe plain-text rendering). Only enable
   * for trusted, non-user-derived markup.
   */
  allowHtml?: boolean;
  /** @deprecated Use `disabled` instead. Retained for backward compatibility. */
  enable?: boolean;
  /** @deprecated Prefer `loading`. Shows a loader; pair with `loaderType`. */
  showLoader?: boolean;
  /** @deprecated Used with `showLoader`. `'Circular'` or `'ProgressBar'`. */
  loaderType?: LoaderType;
  /** @deprecated Drives the progress-bar animation when `loaderType='ProgressBar'`. */
  showProgressBar?: boolean;
  type?: 'submit' | 'reset' | 'button';
  testId?: string;
  icon?: Snippet;
  children?: Snippet;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  /**
   * Native `aria-haspopup`. Needed when the button is the trigger for a menu, listbox or
   * dialog — Menu hands exactly this to its `trigger` snippet.
   */
  ariaHaspopup?: 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog' | boolean;
  ariaSelected?: boolean;
  /**
   * Native `aria-busy`, for a control that stays usable while related data loads.
   * Deliberately separate from `loading`, which also renders the spinner and
   * disables the button — a trigger whose *contents* are still loading must stay
   * clickable, so it cannot express that state through `loading`.
   */
  ariaBusy?: boolean;
  role?: string;
  /**
   * Native `title`, rendered as the browser's own hover tooltip. Distinct from
   * `ariaLabel`, which names the control for assistive tech without any visible
   * affordance; an icon-only button generally wants both.
   */
  title?: string;
  disabled?: boolean;
  classes?: string;
  /**
   * Inline style applied to the outer `.button-container`. Use for per-instance
   * dynamic values a static class can't express — e.g. a CSS custom property
   * driven by runtime state (`--offset: {n}px`). Prefer `classes` / `--button-*`
   * tokens for anything static.
   */
  style?: string;
};

export type ButtonEventProperties = {
  onclick?: (event: MouseEvent) => void;
  /** Fires when a key is pressed down while the button has focus. */
  onkeydown?: (event: KeyboardEvent) => void;
  /** Fires when a key is released while the button has focus. */
  onkeyup?: (event: KeyboardEvent) => void;
  /** Fires when a mouse button is pressed down on the button. */
  onmousedown?: (event: MouseEvent) => void;
  /** Fires when a mouse button is released over the button. */
  onmouseup?: (event: MouseEvent) => void;
  /** Fires when the pointer leaves the button area. */
  onmouseleave?: (event: MouseEvent) => void;
  /** Fires when a touch point is placed on the button. */
  ontouchstart?: (event: TouchEvent) => void;
  /** Fires when a touch point is removed from the button. */
  ontouchend?: (event: TouchEvent) => void;
};
