export type LoadingDotsAnimation = 'bounce' | 'pulse';

export type LoadingDotsProperties = OptionalLoadingDotsProperties;

export type OptionalLoadingDotsProperties = {
  dots?: number;
  animation?: LoadingDotsAnimation;
  testId?: string;
  classes?: string;
};
