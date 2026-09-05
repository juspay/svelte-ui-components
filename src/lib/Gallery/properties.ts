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
  /** @deprecated Use `onimageclick` instead; both work until 4.0.0. */
  onImageClick?: (index: number, event: MouseEvent) => void;
  oneditclick?: (index: number, event: MouseEvent) => void;
  /** @deprecated Use `oneditclick` instead; both work until 4.0.0. */
  onEditClick?: (index: number, event: MouseEvent) => void;
  ondeleteclick?: (index: number, event: MouseEvent) => void;
  /** @deprecated Use `ondeleteclick` instead; both work until 4.0.0. */
  onDeleteClick?: (index: number, event: MouseEvent) => void;
  onopen?: (index: number) => void;
  /** @deprecated Use `onopen` instead; both work until 4.0.0. */
  onOpen?: (index: number) => void;
  onclose?: () => void;
  /** @deprecated Use `onclose` instead; both work until 4.0.0. */
  onDismiss?: () => void;
  onchange?: (index: number) => void;
  /** @deprecated Use `onchange` instead; both work until 4.0.0. */
  onIndexChange?: (index: number) => void;
  onkeydown?: (event: KeyboardEvent) => void;
};
