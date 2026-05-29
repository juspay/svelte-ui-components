export type NavigationMenuItem = {
  id: string;
  label: string;
  icon?: string;
  statusDot?: boolean;
  disabled?: boolean;
};

export type NavigationMenuProperties = {
  items: NavigationMenuItem[];
  selectedId?: string;
  testId?: string;
  classes?: string;
  ariaLabel?: string;
  onselect?: (id: string) => void;
};
