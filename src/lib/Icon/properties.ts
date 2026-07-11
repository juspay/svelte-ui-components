export type IconProperties = OptionalIconProperties & IconEventProperties;

export type OptionalIconProperties = {
  icon?: string;
  svg?: string;
  text?: string | null;
  classes?: string;
  testId?: string;
};

export type IconEventProperties = {
  onclick?: (event: MouseEvent) => void;
  onkeydown?: (event: KeyboardEvent) => void;
};
