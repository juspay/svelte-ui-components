export type ToggleProperties = ToggleEventProperties & {
  checked?: boolean;
  text: string;
  classes?: string;
};

export type ToggleEventProperties = {
  onclick?: (checked: boolean) => void;
};
