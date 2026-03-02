export type IconProperties = OptionalIconProperties & IconEventProperties & MandatoryIconProperties;

export type MandatoryIconProperties = {
  icon: string;
};

export type OptionalIconProperties = {
  text?: string | null;
  classes?: string;
};

export type IconEventProperties = {
  onclick?: (event: MouseEvent) => void;
  onkeydown?: (event: KeyboardEvent) => void;
};
