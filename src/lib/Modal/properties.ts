import type { ModalTransition } from '$lib/types';

export type ModalSize = 'large' | 'medium' | 'small' | 'fit-content';
export type ModalAlign = 'top' | 'center' | 'bottom';

export type ModalProperties = {
  size: ModalSize;
  align: ModalAlign;
  showOverlay: boolean;
  supportHardwareBackPress: boolean;
  enableTransition: boolean;
  transitionType: ModalTransition;
  header: {
    leftImage: string | null;
    rightImage: string | null;
    text: string | null;
  };
  debounceTime: number;
};

export const defaultModalProperties: ModalProperties = {
  size: 'fit-content',
  align: 'center',
  showOverlay: true,
  supportHardwareBackPress: false,
  header: {
    leftImage: null,
    rightImage: null,
    text: null
  },
  enableTransition: true,
  transitionType: 'ALL',
  debounceTime: 700,
};
