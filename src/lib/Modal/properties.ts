import type { ButtonProperties } from '$lib/Button/properties';
import type { ModalTransition } from '$lib/types';
import type { Snippet } from 'svelte';

export type ModalSize = 'large' | 'medium' | 'small' | 'fit-content';
export type ModalAlign = 'top' | 'center' | 'bottom';
/**
 * Overrides ModalAnimation's default per-align entry transition ('top'/'bottom'
 * fly, 'center' fade). 'slide-up' and 'slide-down' reuse the same fly
 * distance/duration constants as bottom/top alignment respectively, so e.g. a
 * centered modal can slide up like a bottom sheet instead of just fading in.
 * Leave unset to keep the existing per-align default.
 */
export type ModalEntryAnimation = 'fade' | 'slide-up' | 'slide-down';

/**
 * 'alertdialog' is for a dialog that interrupts to demand an immediate
 * response (e.g. a destructive confirmation) -- semantically distinct from an
 * ordinary 'dialog' in how assistive tech announces it. See the `role` prop.
 */
export type ModalRole = 'dialog' | 'alertdialog';

export type ModalProperties = OptionalModalProperties & ModalEventProperties;

export type OptionalModalProperties = {
  size?: ModalSize;
  align?: ModalAlign;
  showOverlay?: boolean;
  supportHardwareBackPress?: boolean;
  enableTransition?: boolean;
  transitionType?: ModalTransition;
  /** Overrides the default per-align entry transition. See ModalEntryAnimation. Default: unset (per-align behavior). */
  entryAnimation?: ModalEntryAnimation;
  header?: {
    leftImage?: string;
    rightImage?: string;
    text?: string;
    testId?: string;
    buttonTestId?: string;
    /** Accessible name for the right header image's role="button" wrapper (e.g. a close control). Rendered as aria-label. */
    buttonAriaLabel?: string;
  };
  footer?: {
    primaryButton?: ButtonProperties;
    secondaryButton?: ButtonProperties;
  };
  debounceTime?: number;
  leftImageTestId?: string;
  /** Accessible name for the left header image's role="button" wrapper (e.g. a back control). Rendered as aria-label. */
  leftImageAriaLabel?: string;
  /**
   * Accessible name for the overlay's `role="button"` wrapper, rendered as
   * `aria-label` -- same pattern as `leftImageAriaLabel` and
   * `header.buttonAriaLabel`. Only meaningful when the overlay is dismissible
   * (an `onoverlayclick` or `ondismiss` handler is supplied), which is the
   * only state where the overlay is announced as a focusable "button" at all.
   * Default: unset (no accessible name).
   */
  overlayAriaLabel?: string;
  testId?: string;
  content?: Snippet;
  footerSnippet?: Snippet;
  classes?: string;
  /** CSS value applied to backdrop-filter on the overlay (e.g. "blur(6px)"). Exposed as --modal-overlay-backdrop-filter CSS var. Default: none (no blur). */
  overlayBackdropFilter?: string;
  /** When true, the overlay backdrop fades in on mount instead of appearing instantly. Pairs well with entryAnimation="slide-up" for a softer combined entrance. Default: false (current instant-appear behavior). */
  overlayFadeIn?: boolean;
  /** When true, mounts the overlay at document.body to escape clipping/stacking contexts. Default: false. */
  usePortal?: boolean;
  /** When true, locks document.body scroll while the modal is mounted, restoring it on unmount. Default: true (matches prior unconditional behavior). Set false for a non-blocking modal that should allow background scroll. */
  lockScroll?: boolean;
  /** Milliseconds after mount to automatically fire onclose, e.g. for a transient success/confirmation modal. null (default) disables auto-dismiss. */
  autoDismissAfter?: number | null;
  /**
   * Accessible name for the modal, rendered as `aria-label` on the modal
   * content panel (the element carrying `role`/`aria-modal` when `role` is
   * set). Without it a screen reader announces an unnamed dialog. Default:
   * unset (no aria-label) -- matches today's behavior, where the panel has no
   * accessible name at all.
   */
  ariaLabel?: string;
  /**
   * ARIA role for the modal content panel. Default: unset -- the panel
   * renders no `role` and no `aria-modal` at all, byte-for-byte matching
   * behavior prior to this prop's introduction, so an existing consumer who
   * never touches `role` sees no DOM/ARIA change. Set it explicitly (e.g.
   * `'dialog'` or `'alertdialog'`) to opt in: the panel then also carries
   * `aria-modal="true"`, since a role without aria-modal is not a complete
   * dialog announcement.
   */
  role?: ModalRole;
};

export type ModalEventProperties = {
  onclose?: () => void;
  onheaderrightimageclick?: (event: MouseEvent) => void;
  onheaderleftimageclick?: (event: MouseEvent) => void;
  onprimarybuttonclick?: (event: MouseEvent) => void;
  onsecondarybuttonclick?: (event: MouseEvent) => void;
  onoverlayclick?: () => void;
  onkeydown?: (event: KeyboardEvent) => void;
  /**
   * Fires on every path that dismisses the modal from the OUTSIDE: an overlay
   * click, the Escape key, and a hardware back-press. A superset of
   * onoverlayclick (backdrop click + Escape only) and onclose (hardware
   * back-press + autoDismissAfter only) -- wire this single callback instead
   * of both when all a consumer needs is "the modal wants to close". Both
   * existing events keep firing unchanged alongside it; autoDismissAfter's
   * timer still fires only onclose, not ondismiss, since that path is the
   * modal closing itself rather than something dismissing it.
   */
  ondismiss?: () => void;
};
