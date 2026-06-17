import type { Snippet } from 'svelte';

export type StepStatus = 'completed' | 'active' | 'pending' | 'failure' | 'in-progress';

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
};

export type MandatoryStepperProperties = {
  steps: Array<Step>;
  currentStepIndex: number;
};

export type OptionalStepperProperties = {
  orientation?: 'horizontal' | 'vertical';
  classes?: string;
  testId?: string;
};

export type StepperEventProperties = {
  onstepclick?: (event: { selectedIndex: number }) => void;
  /** @deprecated Use `onstepclick` instead. */
  onhandleStepClick?: (event: { selectedIndex: number }) => void;
};

export type StepperProperties = MandatoryStepperProperties &
  OptionalStepperProperties &
  StepperEventProperties;

export type OptionalStepProperties = {
  icon?: string;
  status?: StepStatus;
  badge?: Snippet;
  classes?: string;
};

export type StepEventProperties = {
  onclick?: (event: { selectedIndex: number }) => void;
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
