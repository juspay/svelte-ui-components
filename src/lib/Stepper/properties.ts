export type StepperProperties = {
  steps: Array<Step>;
  currentStepIndex: number;
  onhandleStepClick?: (event: { selectedIndex: number }) => void;
};

export type Step = {
  label: string;
  icon?: string;
};

export type StepProperties = OptionalStepProperties &
  StepEventProperties & {
    stepIndex: number;
    label: string;
  };

export type OptionalStepProperties = {
  icon?: string;
};

export type StepEventProperties = {
  onclick?: (event: { selectedIndex: number }) => void;
  onkeydown?: (event: KeyboardEvent) => void;
};
