export type IconProperties = OptionalIconProperties & IconEventProperties;

export type OptionalIconProperties = {
  icon?: string;
  svg?: string;
  text?: string | null;
  classes?: string;
  testId?: string;
  /** Whether the container renders as an interactive control (role="button",
   * tabindex, and the onclick/onkeydown handlers). Defaults to `true`, matching
   * the component's original always-interactive behavior. Set to `false` for
   * purely decorative/informational icons that don't respond to input. */
  interactive?: boolean;
};

export type IconEventProperties = {
  onclick?: (event: MouseEvent) => void;
  onkeydown?: (event: KeyboardEvent) => void;
};
