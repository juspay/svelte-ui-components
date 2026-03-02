import type { Snippet } from 'svelte';

export type PhoneVariant = 'modern' | 'classic';

export type PhoneProperties = OptionalPhoneProperties;

export type OptionalPhoneProperties = {
  children?: Snippet;
  variant?: PhoneVariant;
  showStatusBar?: boolean;
  showHomeBar?: boolean;
  testId?: string;
  classes?: string;
};
