import type { Snippet } from 'svelte';
import type { ButtonProperties } from '../Button/properties';

export type ActionBarProperties = {
  testId?: string;
  classes?: string;
  divider?: boolean;
  primaryButton?: ButtonProperties;
  secondaryButton?: ButtonProperties;
  children?: Snippet;
};
