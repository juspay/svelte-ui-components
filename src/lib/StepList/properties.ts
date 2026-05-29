import type { Snippet } from 'svelte';

export type StepStatus = 'pending' | 'in-progress' | 'success' | 'failure' | 'inactive';

export type StepListStep = {
  id: string;
  title: string;
  description?: string;
  status?: StepStatus;
  testId?: string;
};

export type StepListProperties = {
  steps: StepListStep[];
  testId?: string;
  classes?: string;
  stepBody?: Snippet;
};
