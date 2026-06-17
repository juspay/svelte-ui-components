export type LottieRendererType = 'svg' | 'canvas' | 'html';

export type LottiePlayerProperties = MandatoryLottiePlayerProperties &
  OptionalLottiePlayerProperties &
  LottiePlayerEventProperties;

/**
 * Placeholder for future mandatory props. Follows the library-wide pattern used by Card, Badge,
 * etc. — kept so the type shape is consistent when mandatory props are added later.
 */
export type MandatoryLottiePlayerProperties = Record<never, never>;

export type OptionalLottiePlayerProperties = {
  /**
   * URL or path to the Lottie animation JSON file. Ignored when `animationData` is provided.
   */
  src?: string;
  /**
   * Inline animation data object. Takes precedence over `src` when both are provided.
   */
  animationData?: Record<string, unknown>;
  autoplay?: boolean;
  loop?: boolean;
  /** Playback speed multiplier. Default 1. */
  speed?: number;
  /** Rendering backend. Default 'svg'. */
  renderer?: LottieRendererType;
  /**
   * Whether the player element is hidden from assistive technology.
   * Default true — decorative animations should be invisible to screen readers.
   */
  ariaHidden?: boolean;
  testId?: string;
  classes?: string;
};

export type LottiePlayerEventProperties = {
  /** Fired when the animation completes (non-looping). */
  oncomplete?: () => void;
  /** Fired when the animation fails to load. */
  onerror?: () => void;
};
