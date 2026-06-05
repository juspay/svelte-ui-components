import type { Snippet } from 'svelte';

export type CopyButtonStatus = 'idle' | 'copied' | 'failed';

export type CopyButtonProperties = OptionalCopyButtonProperties & CopyButtonEventProperties;

export type OptionalCopyButtonProperties = {
  /** Text written to the clipboard when the button is clicked. */
  textToCopy?: string;
  /** Accessible/announced label shown after a successful copy. Default: 'Copied'. */
  copiedLabel?: string;
  /** Accessible/announced label shown after a failed copy. Default: 'Copy failed'. */
  failedLabel?: string;
  /** aria-label for the button in its idle state. Default: 'Copy to clipboard'. */
  ariaLabel?: string;
  /** How long (ms) the copied/failed state is shown before reverting to idle. Default: 2000. */
  feedbackDuration?: number;
  /** Disables the button. */
  disabled?: boolean;
  /** Override the default copy icon. */
  icon?: Snippet;
  /** Override the default success (checkmark) icon. */
  copiedIcon?: Snippet;
  /** Rendered as the `data-pw` test id on the button element. */
  testId?: string;
  /** Extra class names appended to the button for consumer theming. */
  classes?: string;
};

export type CopyButtonEventProperties = {
  /** Fired after every copy attempt with the text and whether it succeeded. */
  onCopy?: (text: string, success: boolean) => void;
};
