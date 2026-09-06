import type { Snippet } from 'svelte';

export type GalleryView = 'grid' | 'list';

export type GalleryImage = {
  src: string;
  alt: string;
  thumbnail?: string;
  fallback?: string;
  caption?: string;
};

export type GalleryProperties = MandatoryGalleryProperties &
  OptionalGalleryProperties &
  GalleryEventProperties;

export type MandatoryGalleryProperties = {
  images: GalleryImage[];
};

export type OptionalGalleryProperties = {
  view?: GalleryView;
  open?: boolean;
  activeIndex?: number;
  enableLightbox?: boolean;
  loop?: boolean;
  showCounter?: boolean;
  showCaption?: boolean;
  previousIcon?: Snippet;
  nextIcon?: Snippet;
  closeIcon?: Snippet;
  editIcon?: Snippet;
  deleteIcon?: Snippet;
  itemFooter?: Snippet<[GalleryImage, number]>;
  testId?: string;
  classes?: string;
};

export type GalleryEventProperties = {
  onimageclick?: (index: number, event: MouseEvent) => void;
  oneditclick?: (index: number, event: MouseEvent) => void;
  ondeleteclick?: (index: number, event: MouseEvent) => void;
  onopen?: (index: number) => void;
  onclose?: () => void;
  onchange?: (index: number) => void;
  onkeydown?: (event: KeyboardEvent) => void;
};
