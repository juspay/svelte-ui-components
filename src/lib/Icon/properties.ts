export type IconProperties = OptionalIconProperties & IconEventProperties;

export type OptionalIconProperties = {
  /** Paint a monochrome asset with currentColor using a native CSS mask. */
  mask?: boolean;
  /** Pixel size of a mask icon. Otherwise uses --icon-size (24px by default). */
  size?: number;
  /** Mask color override; omitted icons inherit currentColor. */
  color?: string;
  /** Accessible name for a mask icon or its action. Omit for decoration. */
  label?: string;
  icon?: string;
  svg?: string;
  text?: string | null;
  classes?: string;
  testId?: string;
};

export type IconEventProperties = {
  onclick?: (event: MouseEvent) => void;
  onkeydown?: (event: KeyboardEvent) => void;
};
