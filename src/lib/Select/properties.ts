import type { ButtonProperties } from '$lib/Button/properties';
import type { ImgProps } from '$lib/Img/properties';
export type SelectProperties = {
  placeholder: string;
  label: string;
  allItems: string[];
  selectedItem: string | string[];
  selectedItemLabel: string | string[] | null;
  showSelectedItemInDropdown: boolean;
  selectMultipleItems: boolean;
  hideDropDownIcon?: boolean;
  dropDownIcon?: string;
  leftIcon: ImgProps | null;
  addInputButton?: boolean;
  addInputButtonProps?: ButtonProperties;
};
