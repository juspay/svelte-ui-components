export type LoaderType = 'Circular' | 'ProgressBar';

export type ButtonProperties = {
  text: string;
  enable: boolean;
  showLoader: boolean;
  loaderType: LoaderType | null;
  type: 'submit' | 'reset' | 'button';
};

export const defaultButtonProperties: ButtonProperties = {
  text: 'click',
  enable: true,
  showLoader: false,
  loaderType: null,
  type: 'submit'
};
