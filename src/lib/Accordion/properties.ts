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
  /**
   * `id` for the collapsible panel, which the built-in trigger references via
   * `aria-controls`. Defaults to a generated, per-instance id, so the trigger and
   * panel are always linked without any caller involvement. Supply one only when
   * something else needs to reference the panel by a known id.
   */
  panelId?: string;
};

export type AccordionEventProperties = {
  ontoggle?: (expanded: boolean) => void;
  onToggle?: (expanded: boolean) => void;
};
