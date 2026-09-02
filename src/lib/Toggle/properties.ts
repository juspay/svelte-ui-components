export type ToggleProperties = OptionalToggleProperties & ToggleEventProperties;

export type OptionalToggleProperties = {
  text?: string;
  checked?: boolean;
  disabled?: boolean;
  testId?: string;
  classes?: string;
};

export type ToggleEventProperties = {
  onclick?: (checked: boolean) => void;
  onClick?: (checked: boolean) => void;
};
