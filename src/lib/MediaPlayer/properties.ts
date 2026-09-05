import type { Snippet } from 'svelte';

export type MediaType = 'image' | 'video';

export type MediaPlayerProperties = MandatoryMediaPlayerProperties &
  OptionalMediaPlayerProperties &
  MediaPlayerEventProperties;

export type MandatoryMediaPlayerProperties = {
  src: string;
  type: MediaType;
};

export type OptionalMediaPlayerProperties = {
  alt?: string;
  fallback?: string;
  autoplay?: boolean;
  loop?: boolean;
  controls?: boolean;
  playing?: boolean;
  muted?: boolean;
  playIcon?: Snippet;
  pauseIcon?: Snippet;
  muteIcon?: Snippet;
  unmuteIcon?: Snippet;
  /** URL of a WebVTT captions file. Omit entirely to render no captions track at all
   *  (rather than an empty, non-functional one). */
  captionsSrc?: string;
  /** Label shown in the browser's caption/track menu. Only meaningful with captionsSrc. */
  captionsLabel?: string;
  /** BCP 47 language tag for the captions track, e.g. "en". Only meaningful with captionsSrc. */
  captionsSrcLang?: string;
  testId?: string;
  classes?: string;
};

export type MediaPlayerEventProperties = {
  onplay?: (event: Event) => void;
  onpause?: (event: Event) => void;
  onvolumechange?: (muted: boolean) => void;
  /** @deprecated Use `onvolumechange` instead; both work until 4.0.0. */
  onVolumeChange?: (muted: boolean) => void;
};
