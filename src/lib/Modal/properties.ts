import type { ButtonProperties } from '$lib/Button/properties';
import type { ModalTransition } from '$lib/types';
import type { Snippet } from 'svelte';

export type ModalSize = 'large' | 'medium' | 'small' | 'fit-content';
export type ModalAlign = 'top' | 'center' | 'bottom';

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
  };
  footer?: {
    primaryButton?: ButtonProperties;
    secondaryButton?: ButtonProperties;
  };
  debounceTime?: number;
  leftImageTestId?: string;
  testId?: string;
  content?: Snippet;
  footerSnippet?: Snippet;
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
