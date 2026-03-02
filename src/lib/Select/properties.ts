export type SelectProperties = MandatorySelectProperties &
  OptionalSelectProperties &
  SelectEventProperties;

export type SelectItem = {
  id: string;
  label: string;
};

export type MandatorySelectProperties = {
  items: SelectItem[];
};

export type OptionalSelectProperties = {
  value?: string[];
  multiple?: boolean;
  searchable?: boolean;
  placeholder?: string;
  disabled?: boolean;
  testId?: string;
  classes?: string;
};

export type SelectEventProperties = {
  onchange?: (value: string[]) => void;
};
