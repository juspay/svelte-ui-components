export type KeyboardInputProperties = MandatoryKeyboardInputProperties &
  OptionalKeyboardInputProperties &
  KeyboardInputEventProperties;

export type MandatoryKeyboardInputProperties = {
  keys: string[] | string;
};

export type OptionalKeyboardInputProperties = {
  separator?: string;
  testId?: string;
  classes?: string;
};

export type KeyboardInputEventProperties = {
  onclick?: (event: MouseEvent) => void;
};
