import type { ButtonProperties } from '$lib/Button/properties';
import type { ModalTransition } from '$lib/types';
import type { Snippet } from 'svelte';

export type ModalSize = 'large' | 'medium' | 'small' | 'fit-content';
export type ModalAlign = 'top' | 'center' | 'bottom' | 'right';

export type ModalProperties = ModalEventProperties & {
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
    /** Secondary line rendered beneath the header title. Rendered only when non-empty. */
    description?: string;
    /** When false the close button (rightImage) is hidden. Defaults to true (current behaviour). */
    showCloseButton?: boolean;
  };
  footer?: {
    primaryButton?: ButtonProperties;
    secondaryButton?: ButtonProperties;
  };
  /** When true renders a divider line between the header/footer and the content area. Default false. */
  showDivider?: boolean;
  /**
   * When provided, renders a compact confirmation dialogue (bodyText + optional footer buttons)
   * instead of the content snippet. When omitted the content snippet is rendered as today.
   */
  dialogueConfig?: {
    bodyText: string;
    footerConfig?: {
      primaryButton?: ButtonProperties;
      secondaryButton?: ButtonProperties;
    };
  };
  debounceTime?: number;
  leftImageTestId?: string;
  testId?: string;
  content?: Snippet;
  footerSnippet?: Snippet;
  classes?: string;
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
