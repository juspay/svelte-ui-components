import type { ButtonProperties } from '$lib/Button/properties';
import type { ModalTransition } from '$lib/types';
import type { Snippet } from 'svelte';

export type ModalSize = 'large' | 'medium' | 'small' | 'fit-content';
export type ModalAlign = 'top' | 'center' | 'bottom';

export type ModalProperties = OptionalModalProperties & ModalEventProperties;

export type OptionalModalProperties = {
  size?: ModalSize;
  align?: ModalAlign;
  showOverlay?: boolean;
  supportHardwareBackPress?: boolean;
  enableTransition?: boolean;
  transitionType?: ModalTransition;
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
