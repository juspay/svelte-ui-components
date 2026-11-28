import type { ButtonProperties } from '../Button/properties';
import { defaultInputProperties } from '../Input/properties';
import type { InputProperties } from '../Input/properties';

export type InputButtonProperties = {
  inputProperties: InputProperties;
  rightButtonProperties: ButtonProperties | null;
  leftButtonProperties: ButtonProperties | null;
  bottomButtonProperties?: ButtonProperties | null;
};

const inputProperties: InputProperties = {
  ...defaultInputProperties,
  actionInput: true
};

const rightButtonProperties: ButtonProperties = {
  text: 'click',
  enable: false,
  showLoader: false,
  loaderType: null,
  type: 'submit'
};

export const defaultInputButtonProperties: InputButtonProperties = {
  inputProperties,
  rightButtonProperties,
  leftButtonProperties: null,
  bottomButtonProperties: null
};
