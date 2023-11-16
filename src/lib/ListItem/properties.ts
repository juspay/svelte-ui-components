export type ListItemProperties = {
  leftImageUrl: string | null;
  rightImageUrl: string | null;
  label: string | null;
  useAccordion: boolean;
  rightContentText: string | null;
};

export const defaultListItemProperties: ListItemProperties = {
  leftImageUrl: null,
  rightImageUrl: null,
  label: null,
  useAccordion: false,
  rightContentText: null
};
