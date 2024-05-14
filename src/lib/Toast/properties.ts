export type ToastType = 'success' | 'error' | 'info' | 'warn';

export type ToastProperties = {
  duration: number;
  leftIcon?: string;
  message: string;
  rightIcon?: string;
  type?: ToastType;
};

export const defaultToastProperties: ToastProperties = {
  duration: 2000,
  message: ''
};
