export type ImgProperties = MandatoryImgProperties & OptionalImgProperties & ImgEventProperties;

export type MandatoryImgProperties = {
  src: string;
  alt: string;
};

export type OptionalImgProperties = {
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
  onerror?: () => void;
  /** @deprecated Use `onerror` instead; both work until 4.0.0. */
  onError?: () => void;
};
