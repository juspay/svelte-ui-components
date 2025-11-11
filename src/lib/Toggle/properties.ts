export type ToggleProperties = ToggleEventProperties & {
  checked?: boolean;
  text: string;
};

export type ToggleEventProperties = {
  onclick?: (checked: boolean) => void;
};
