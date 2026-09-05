import type { Snippet } from 'svelte';

/** The interaction wiring Menu hands to its `trigger` snippet. */
export type MenuTriggerProps = {
  onclick: (event: MouseEvent) => void;
  onkeydown: (event: KeyboardEvent) => void;
  /** camelCase to match the library's own prop convention, so it spreads onto Button. */
  ariaHaspopup: 'menu';
  ariaExpanded: boolean;
};

export type MenuItem = {
  label: string;
  value: string;
  icon?: string;
  disabled?: boolean;
  danger?: boolean;
  separator?: boolean;
  id?: string;
};

/**
 * Corner of the trigger the dropdown anchors to. The four fixed corners map to
 * static CSS anchoring; `'auto'` measures the rendered panel on every open and
 * picks the corner that keeps it inside the viewport — right-anchoring when the
 * panel would overflow the right edge, flipping above the trigger when there is
 * not enough room below but enough above.
 */
export type MenuPlacement = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'auto';

export type MenuProperties = MandatoryMenuProperties & OptionalMenuProperties & MenuEventProperties;

export type MandatoryMenuProperties = {
  items: MenuItem[];
};

export type OptionalMenuProperties = {
  open?: boolean;
  testId?: string;
  /**
   * Renders the control that opens the menu. Receives Menu's interaction wiring, so a
   * consumer whose trigger is ITSELF an interactive element (a Button, say) can spread
   * it onto that element and set `interactiveTrigger` — see below. A snippet that
   * declares no parameters simply ignores what it is handed, so existing triggers are
   * unaffected.
   */
  trigger?: Snippet<[MenuTriggerProps]>;
  /**
   * Set when the trigger snippet renders its own interactive element. Menu then stops
   * making its wrapper a second one.
   *
   * By default Menu wraps the trigger in a `role="button" tabindex="0"` div carrying
   * the click/keydown handlers. That is correct for inert trigger content, but if the
   * snippet renders a real control the result is two focusable elements for one
   * conceptual trigger — two Tab stops, both announcing as a button, and interactive
   * content nested inside interactive content. Defaults to `false`, preserving the
   * existing behaviour for every current consumer.
   */
  interactiveTrigger?: boolean;
  classes?: string;
  /** Rewrites each item icon's SVG markup before it is inlined. */
  transformSvg?: (svg: string) => string;
  /** Value of the currently selected item. When set, opening the menu focuses the
   * selected option instead of the first item, the matching item gets the
   * `menu-item-selected` class (stylable via --menu-item-selected-*), and
   * listbox aria-selected reflects the real selection. */
  selectedValue?: string | null;
  role?: 'menu' | 'listbox';
  ariaLabel?: string;
  /** Accessible name for the TRIGGER — the element that actually takes focus.
   *  `ariaLabel` names the dropdown, which is portaled to <body>, so it cannot
   *  name the control the user tabs to. Applies only when `interactiveTrigger`
   *  is false; when true the snippet's own control owns its name. */
  triggerAriaLabel?: string;
  id?: string;
  /** Dropdown anchoring relative to the trigger. Defaults to `'bottom-left'`,
   * which preserves the existing behavior (including the `--menu-dropdown-top`
   * / `--menu-dropdown-left` consumer tokens). Fixed corners anchor statically;
   * `'auto'` resolves the best-fitting corner against the viewport on open. */
  placement?: MenuPlacement;
  /**
   * When `true`, the dropdown panel is portaled to `document.body` and positioned
   * `fixed` at the resolved `placement` corner, so an ancestor with
   * `overflow: hidden` or a scroll container (e.g. a table cell) cannot clip it.
   * Placement follows the trigger on scroll/resize. Defaults to `false` (in-flow
   * `position: absolute`), which preserves the existing behaviour — including any
   * consumer CSS that targets `.menu-dropdown` via an ancestor selector, since
   * that only resolves while the panel stays inside the `.menu-container`. Opt in
   * for Menus rendered inside clipping containers. When portaled the panel defaults
   * to `z-index: 1000` (top-layer band); raise `--menu-z-index` if it must sit
   * above an even higher overlay.
   */
  usePortal?: boolean;
};

export type MenuEventProperties = {
  onselect?: (item: MenuItem) => void;
  /** @deprecated Use `onselect` instead; both work until 4.0.0. */
  onSelect?: (item: MenuItem) => void;
  onopen?: () => void;
  /** @deprecated Use `onopen` instead; both work until 4.0.0. */
  onOpen?: () => void;
  onclose?: () => void;
  /** @deprecated Use `onclose` instead; both work until 4.0.0. */
  onClose?: () => void;
};
