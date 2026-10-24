import type { HTMLImgAttributes } from 'svelte/elements';

export type ImgProperties = MandatoryImgProperties & OptionalImgProperties & ImgEventProperties;

export type MandatoryImgProperties = {
  src: string;
  alt: string;
};

export type OptionalImgProperties = {
  /** Render only the native element, without component appearance or layout wrappers. */
  unstyled?: boolean;
  /** Native image attributes, present during SSR and before the first request.
   * Component-owned source, alternative text, classes, callbacks and test hooks
   * must use their dedicated props instead. */
  nativeAttrs?: Omit<HTMLImgAttributes, 'src' | 'alt' | 'class' | 'onerror' | 'onload'>;
  /** Bindable native image/SVG reference for measurement and animation. */
  element?: HTMLImageElement | SVGSVGElement | null;
  fallback?: string | null;
  classes?: string;
  /**
   * Fetch `.svg` / `data:image/svg+xml` sources and inline their markup into an
   * `<svg>` host element so page CSS (currentColor, fill/stroke overrides) applies
   * to the icon. Non-SVG sources always render the plain `<img>`. If fetching or
   * parsing fails, the component falls back to the plain `<img>` (and from there
   * to the regular `fallback`/`onerror` chain).
   */
  inlineSvg?: boolean;
  /**
   * Hook to rewrite the fetched SVG markup before it is inlined (e.g. recolor
   * hardcoded fills). Receives the raw SVG text and returns the transformed text.
   * Providing a transform implies `inlineSvg`. The inlining effect re-runs when
   * the prop identity changes, so consumers can pass a closure over reactive
   * state (e.g. a theme colour) to get live re-renders on theme change.
   */
  transformSvg?: (svg: string) => string;
  testId?: string;
};

export type ImgEventProperties = {
  onload?: (event: Event) => void;
  /** Released 4.x callback remains callable without an argument. */
  onerror?: () => void;
  /** Opt-in native error event, after the same fallback chain as onerror. */
  onimageerror?: (event: Event) => void;
};
