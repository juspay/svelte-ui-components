export type IframeViewerProperties = MandatoryIframeViewerProperties &
  OptionalIframeViewerProperties &
  IframeViewerEventProperties;

export type MandatoryIframeViewerProperties = {
  /** URL loaded into the iframe. */
  src: string;
};

export type OptionalIframeViewerProperties = {
  /** Accessible title for the iframe (default: `'Embedded Content'`). */
  title?: string;
  /**
   * Origins allowed to send `postMessage` events to `onMessage`. An empty array (the
   * default) processes nothing — secure by default.
   */
  allowedOrigins?: string[];
  /** Permissions policy for the iframe `allow` attribute (default: `'fullscreen'`). */
  allow?: string;
  /** Value for the iframe `sandbox` attribute. Omitted when not set. */
  sandbox?: string;
  /**
   * Sets the iframe's `credentialless` attribute, isolating it from the embedding
   * document's credentials/storage. Applied in the same render statement as `src` (not
   * via a post-mount effect), so it is guaranteed to be present before the iframe's
   * first load — no timing dependency on effect scheduling.
   */
  credentialless?: boolean;
  /** Loading strategy for the iframe. Omitted when not set. */
  loading?: 'eager' | 'lazy';
  /** Referrer policy for the iframe. Omitted when not set. */
  referrerpolicy?: ReferrerPolicy;
  /** Test selector applied as `data-pw` on the container. */
  testId?: string;
  /** Additional CSS classes applied to the container. */
  classes?: string;
};

export type IframeViewerEventProperties = {
  /**
   * Called with the `MessageEvent` for `postMessage` events whose origin is in
   * `allowedOrigins` and whose source is the embedded iframe window.
   */
  onMessage?: (event: MessageEvent) => void;
};
