import type { Snippet } from 'svelte';

export type ArmedButtonProperties = {
  /**
   * Called on the SECOND click, after the button has disarmed. Disarming
   * happens before this is awaited, not after -- a slow confirm must not
   * hold the button in its armed, mid-confirmation-looking state.
   */
  onconfirm: () => void | Promise<void>;
  /** Resting label. Replaced by `confirmLabel` while armed. */
  label: string;
  /** Shown in place of `label` while armed. Short -- it replaces the label, not beside it. */
  confirmLabel?: string;
  /** How long the armed state lasts before disarming itself. */
  armedMs?: number;
  disabled?: boolean;
  /**
   * Native title attribute. Defaults to `label` at rest and "click again to
   * <label, lowercased>" while armed.
   */
  title?: string;
  /** Replaces the resting label with an icon; `confirmLabel` still shows as text once armed. */
  icon?: Snippet;
  classes?: string;
};
