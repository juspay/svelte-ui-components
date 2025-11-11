import type { Snippet } from 'svelte';
import type { ImgProperties } from '$lib/Img/properties';

export type SelectProperties = SelectEventProperties & {
  dropDownIconAlt?: string;
  placeholder?: string | null;
  label?: string | null;
  allItems?: string[];
  selectedItem?: string | string[];
  selectedItemLabel?: string | string[] | null;
  showSelectedItemInDropdown?: boolean;
  selectMultipleItems?: boolean;
  hideDropDownIcon?: boolean;
  dropDownIcon?: string;
  leftIcon?: ImgProperties | null;
  showSingleSelectButton?: boolean;
  showSelectedItem?: boolean;
  showSelectedItemCount?: boolean;
  testId?: string;
  labelTestId?: string;
  itemTestId?: string;
  leftContent?: Snippet;
  bottomContent?: Snippet;
};

export type SelectEventProperties = {
  onselect?: (event: { selectedItems: string | string[] }) => void;
  ondropdownClick?: () => void;
  onkeydown?: (event: KeyboardEvent) => void;
};
