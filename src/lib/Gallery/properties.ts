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
  onImageClick?: (index: number, event: MouseEvent) => void;
  onEditClick?: (index: number, event: MouseEvent) => void;
  onDeleteClick?: (index: number, event: MouseEvent) => void;
  onOpen?: (index: number) => void;
  onDismiss?: () => void;
  onIndexChange?: (index: number) => void;
  onkeydown?: (event: KeyboardEvent) => void;
};
