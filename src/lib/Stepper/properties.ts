export type StepperProperties = {
  steps: Array<Step>;
  currentStepIndex: number;
};

export type Step = {
  label: string;
  icon?: string;
};
