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
};

export type ModalEventProperties = {
  onclose?: () => void;
  onheaderRightImageClick?: (event: MouseEvent) => void;
  onheaderLeftImageClick?: (event: MouseEvent) => void;
  onprimaryButtonClick?: (event: MouseEvent) => void;
  onsecondaryButtonClick?: (event: MouseEvent) => void;
  onoverlayClick?: () => void;
  onkeydown?: (event: KeyboardEvent) => void;
};
