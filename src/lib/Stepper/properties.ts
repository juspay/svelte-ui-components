export type StepperProperties = {
  steps: Array<string>;
  currentStepIndex: number;
};

export const defaultStepperProperties: StepperProperties = {
  steps: ['Address', 'Contact', 'Payment'],
  currentStepIndex: 0
};

export type StepProperties = {
  stepIndex: number;
  stepLabel: string;
  showStepLine: boolean;
  status: 'completed' | 'active' | 'next';
  animateClass: string;
};
export const defaultStepProperties: StepProperties = {
  stepIndex: 0,
  stepLabel: '',
  showStepLine: true,
  status: 'next',
  animateClass: ''
};
