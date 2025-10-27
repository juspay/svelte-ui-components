export type GridItemProperties = {
  icon: string;
  text: string;
  headerIcon?: string | null;
  showLoader?: boolean;
  onclick?: (event: MouseEvent) => void;
  onkeydown?: (event: KeyboardEvent) => void;
};
