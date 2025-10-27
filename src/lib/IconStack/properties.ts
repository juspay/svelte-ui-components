export type IconStackItem = {
  type: 'image' | 'text';
  content: string;
};

export type IconStackProperties = {
  icons: IconStackItem[];
};
