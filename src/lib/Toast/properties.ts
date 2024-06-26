export type ToastType = 'success' | 'error' | 'info' | 'warn';
export type ToastDirection = 'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top';

export type ToastProperties = {
  duration: number;
  leftIcon?: string;
  message: string;
  subtext?: string,
  rightIcon?: string;
  type?: ToastType;
  direction?: ToastDirection;
  overlapPage?: boolean;
  inAnimationOffset?: number;
  inAnimationDuration?: number;
  outAnimationOffset?: number;
  outAnimationDuration?: number;
};

export const defaultToastProperties: ToastProperties = {
  duration: 2000,
  message: ''
};
