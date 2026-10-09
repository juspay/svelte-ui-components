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
  /** Accessible name for the video. Image naming uses alt. Defaults to "Video player". */
  ariaLabel?: string;
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
  /**
   * Render a captions toggle in the bottom controls: a real `<button>` named "Captions"
   * whose `aria-pressed` carries the on/off state. Video only, and only when `captionsSrc`
   * is supplied -- a toggle with no track behind it would be a dead control. Off by
   * default, so a player that showed only play and mute keeps showing only play and mute.
   *
   * It exists because the custom overlay replaces the browser's own controls, and with
   * them the browser's captions menu: without it, a track the page supplied had no
   * viewer-operable way to be shown. With native `controls` the browser's menu does that
   * job and this toggle is not drawn.
   */
  captionsButton?: boolean;
  /**
   * Whether the captions track is showing. Bindable, both directions: the toggle, and the
   * browser's own captions menu under native `controls`, report outward, and a host
   * writing it shows or hides the track -- which is how a host builds its own control.
   * `false` hides the track while leaving it loaded; it does not remove the `<track>`.
   * A browser or OS preference for captions can turn it on at load, in which case the
   * bound value follows. Only meaningful with `captionsSrc`.
   */
  captionsVisible?: boolean;
  /** Replaces the default icon on the captions toggle while captions are hidden. */
  captionsIcon?: Snippet;
  /** Replaces the default icon on the captions toggle while captions are showing. */
  captionsOnIcon?: Snippet;
  /**
   * Render a seek bar in the bottom controls. Video only. The bar is a library
   * `Slider` bound to the media's position, so dragging it scrubs and playback
   * moves the handle. Off by default: a player that was showing only play and mute
   * keeps showing only play and mute.
   *
   * Turning any of the three on also sets `preload="metadata"` on the media, because a
   * seek bar and a clock are unusable until the length is known and a paused player is
   * not otherwise obliged to fetch it.
   */
  seekBar?: boolean;
  /**
   * Render elapsed and total time beside the controls, as `m:ss`, or `h:mm:ss` once
   * the media runs past an hour. Video only, off by default.
   */
  timeDisplay?: boolean;
  /**
   * Render a button that takes the player in and out of fullscreen. Video only, off
   * by default. Fullscreen is requested on the player's own container rather than on
   * the `<video>`, so the overlay controls stay usable while fullscreen.
   */
  fullscreenButton?: boolean;
  /** Replaces the default icon on the fullscreen button while not fullscreen. */
  fullscreenIcon?: Snippet;
  /** Replaces the default icon on the fullscreen button while fullscreen. */
  exitFullscreenIcon?: Snippet;
  /**
   * Playback position in seconds. Bindable, and writable: setting it seeks, which is
   * how a host can restore a saved position or drive its own scrubber.
   */
  currentTime?: number;
  /**
   * Media length in seconds, 0 until metadata loads. Bindable for reading; writing it
   * does not resize the media.
   */
  duration?: number;
  testId?: string;
  classes?: string;
};

export type MediaPlayerEventProperties = {
  onplay?: (event: Event) => void;
  onpause?: (event: Event) => void;
  onvolumechange?: (muted: boolean) => void;
  /**
   * The viewer showed or hid the captions, through the toggle or the browser's own menu.
   * Carries the state it is now in. Does not fire for a host's own `captionsVisible`
   * write, the same split `onseek` keeps between a scrub and a restored position.
   */
  oncaptionschange?: (visible: boolean) => void;
  /**
   * The viewer moved the seek bar. Carries the position seeked to, in seconds.
   * Fires only for a deliberate scrub, not for playback advancing on its own —
   * `ontimeupdate` is the one that fires continuously.
   */
  onseek?: (currentTime: number) => void;
  /** Playback position advanced. Carries the position and the length, both in seconds. */
  ontimeupdate?: (currentTime: number, duration: number) => void;
  /** The player entered or left fullscreen. Carries the state it is now in. */
  onfullscreenchange?: (isFullscreen: boolean) => void;
};
