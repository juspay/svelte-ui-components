export type StepperProperties = {
  steps: Array<Step>;
  currentStepIndex: number;
  onhandleStepClick?: (event: { selectedIndex: number }) => void;
};

export type Step = {
  label: string;
  icon?: string;
};

export type StepProperties = {
  stepIndex: number;
  label: string;
  icon?: string;
  onclick?: (event: { selectedIndex: number }) => void;
  onkeydown?: (event: KeyboardEvent) => void;
};
