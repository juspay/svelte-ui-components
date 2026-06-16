import type { Snippet } from 'svelte';

export type AccordionProperties = OptionalAccordionProperties & AccordionEventProperties;

export type OptionalAccordionProperties = {
  expand?: boolean;
  children?: Snippet;
  trigger?: Snippet<[{ expanded: boolean }]>;
  triggerClasses?: string;
  classes?: string;
  testId?: string;
};

export type AccordionEventProperties = {
  ontoggle?: (expanded: boolean) => void;
};
