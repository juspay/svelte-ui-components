export type GridItemProperties = OptionalGridItemProperties &
  GridItemEventProperties &
  MandatoryGridItemProperties;

export type MandatoryGridItemProperties = {
  icon: string;
  text: string;
};

export type OptionalGridItemProperties = {
  headerIcon?: string | null;
  showLoader?: boolean;
  classes?: string;
};

export type GridItemEventProperties = {
  onclick?: (event: MouseEvent) => void;
  onkeydown?: (event: KeyboardEvent) => void;
};
