export type LoaderProperties = {
  /** Preserve the existing gradient loader by default; opt into native border/orbit paint. */
  variant?: 'default' | 'border' | 'orbit';
  /** Optional accessible status name for a standalone spinner. */
  ariaLabel?: string;
  classes?: string;
  testId?: string;
};
