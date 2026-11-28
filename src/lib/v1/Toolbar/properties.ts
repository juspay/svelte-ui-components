export type ToolbarProperties = {
  showBackButton: boolean;
  text: string | null;
  backIcon: string | null;
};

export const defaultToolbarProperties: ToolbarProperties = {
  showBackButton: true,
  text: null,
  backIcon: 'https://sdk.breeze.in/gallery/icons/back.svg'
};
