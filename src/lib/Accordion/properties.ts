import type { Snippet } from 'svelte';

export type AccordionProperties = OptionalAccordionProperties & AccordionEventProperties;

export type OptionalAccordionProperties = {
  expand?: boolean;
  children?: Snippet;
  trigger?: Snippet<[{ expanded: boolean }]>;
  triggerClasses?: string;
  classes?: string;
  testId?: string;
  /**
   * Disables the built-in trigger: clicks and Enter/Space no longer toggle,
   * the trigger is removed from the tab order, and `aria-disabled="true"` is
   * emitted. The trigger element also gets a `disabled` class so consumers can
   * style the locked state. `expand` is still honoured, so a disabled accordion
   * can be shown open or closed under external (controlled) state.
   */
  disabled?: boolean;
};

export type AccordionEventProperties = {
  ontoggle?: (expanded: boolean) => void;
};
