import type { Snippet } from 'svelte';

/**
 * `muted` is an opt-in, purely additive status: a smaller, subtly-tinted circle
 * for a de-emphasized or supplementary step (e.g. an informational marker
 * riding alongside a primary rail). It is only ever reached by setting a
 * step's `status` explicitly — `resolveStatus` in Stepper.svelte never derives
 * it from `currentStepIndex` — so no existing step changes how it renders.
 */
export type StepStatus = 'completed' | 'active' | 'pending' | 'failure' | 'in-progress' | 'muted';

export type Step = {
  label: string;
  /**
   * URL of a custom icon image. When provided, the icon takes precedence over
   * any `status`-driven rendering (including the `in-progress` spinner).
   */
  icon?: string;
  status?: StepStatus;
  /**
   * Optional Svelte snippet rendered inline after the step label (to its right
   * in horizontal layout, below it in vertical layout). Use it for badges,
   * tags, or other inline metadata — e.g. a count pill, a status chip, or a
   * "New" label.
   */
  badge?: Snippet;
  /**
   * Test selector for this step's root element, rendered as `data-pw`. When
   * omitted and the Stepper itself has a `testId`, falls back to
   * `${stepperTestId}-step-${n}` (1-based). When neither is set, no attribute
   * is rendered.
   */
  testId?: string;
};

export type MandatoryStepperProperties = {
  steps: Array<Step>;
  currentStepIndex: number;
};

export type OptionalStepperProperties = {
  orientation?: 'horizontal' | 'vertical';
  classes?: string;
  testId?: string;
  /**
   * Removes every Step's synthetic role and tab stop while retaining its mouse handlers.
   * Opt in when an ancestor or consumer supplies the semantic interactive control.
   */
  suppressRoleAndTabindex?: boolean;
  /**
   * Stops the Stepper's own root element from rendering `testId` as `data-pw`/`testID`,
   * while per-step ids still derive from `testId` (`${testId}-step-${n}`) exactly as
   * before. Opt in when the element wrapping the Stepper already carries the same
   * `data-pw` value, which would otherwise leave two elements matching that selector.
   */
  suppressContainerTestId?: boolean;
};

export type StepperEventProperties = {
  onstepclick?: (event: { selectedIndex: number }) => void;
  onStepClick?: (event: { selectedIndex: number }) => void;
  /** @deprecated Use `onstepclick` instead. */
  onhandleStepClick?: (event: { selectedIndex: number }) => void;
  onHandleStepClick?: (event: { selectedIndex: number }) => void;
};

export type StepperProperties = MandatoryStepperProperties &
  OptionalStepperProperties &
  StepperEventProperties;

export type OptionalStepProperties = {
  icon?: string;
  status?: StepStatus;
  badge?: Snippet;
  classes?: string;
  /** Test selector for the step's root element, rendered as `data-pw`. */
  testId?: string | null;
  /**
   * Removes Step's synthetic role and tab stop while retaining its mouse handlers.
   * Opt in when an ancestor or consumer supplies the semantic interactive control.
   */
  suppressRoleAndTabindex?: boolean;
};

export type StepEventProperties = {
  onclick?: (event: { selectedIndex: number }) => void;
  onClick?: (event: { selectedIndex: number }) => void;
  onkeydown?: (event: KeyboardEvent) => void;
};

export type StepProperties = OptionalStepProperties &
  StepEventProperties & {
    /** 1-based display index — Stepper passes `stepIndex + 1` so that clicking step 1 returns `selectedIndex: 1`. */
    stepIndex: number;
    label: string;
    orientation?: 'horizontal' | 'vertical';
    /**
     * Accessible label for the step button. When provided, set as `aria-label` on
     * the `role="button"` element, overriding the default `aria-labelledby` association
     * with the visible label text. Use when the visible label alone is insufficient
     * context for screen reader users (e.g. "Step 1 — Cart (completed)").
     */
    ariaLabel?: string;
  };
