export type SeparatorOrientation = 'horizontal' | 'vertical';

export type SeparatorProperties = OptionalSeparatorProperties;

export type MandatorySeparatorProperties = Record<string, never>;

export type OptionalSeparatorProperties = {
  /**
   * Axis the dividing line runs across. `'horizontal'` renders a full-width
   * line (for stacking content vertically); `'vertical'` renders a
   * full-height line (for stacking content side by side).
   */
  orientation?: SeparatorOrientation;
  /**
   * A decorative separator (the default) carries no meaning of its own — it's
   * purely a visual rule between unrelated content — so it is hidden from
   * assistive technology (`aria-hidden="true"`) and takes no ARIA role. Set
   * `false` when the separator actually demarcates two semantically distinct
   * sections (e.g. two groups in a menu); it then takes `role="separator"`
   * with a matching `aria-orientation` so the boundary is announced too.
   */
  decorative?: boolean;
  testId?: string;
  classes?: string;
};
