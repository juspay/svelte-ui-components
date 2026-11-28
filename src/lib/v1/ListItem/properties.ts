export type ListItemProperties = {
  leftImageUrl: string | null;
  leftImageFallbackUrl: string | null;
  rightImageUrl: string | null;
  label: string | null;
  useAccordion: boolean;
  rightContentText: string | null;
  testId?: string;
  topSectionTestId?: string;
  rightImageTestId?: string;
  leftImageTestId?: string;
  centerTextTestId?: string;
};

export const defaultListItemProperties: ListItemProperties = {
  leftImageUrl: null,
  leftImageFallbackUrl: null,
  rightImageUrl: null,
  label: null,
  useAccordion: false,
  rightContentText: null
};
