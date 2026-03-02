import type { Snippet } from 'svelte';

export type PillProperties = MandatoryPillProperties & OptionalPillProperties & PillEventProperties;

export type MandatoryPillProperties = {
  text: string;
};

export type OptionalPillProperties = {
  dismissible?: boolean;
  disabled?: boolean;
  testId?: string;
  dismissIcon?: Snippet;
  classes?: string;
};

export type PillEventProperties = {
  onclick?: (event: MouseEvent) => void;
  ondismiss?: () => void;
};
