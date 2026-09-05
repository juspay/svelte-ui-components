import type { Snippet } from 'svelte';

export type HITLAction = 'approved' | 'rejected' | 'auto-approved';

export type HITLResponse = HITLAction | 'expired';

export type HITLSection = {
  label: string;
  value: string;
};

export type HITLEvent = {
  confirmationId: string;
  action: HITLAction;
  approved: boolean;
};

export type HITLInitialState = {
  approved?: boolean;
  /** `'EXPIRED'` renders the timed-out completion state. */
  status?: string;
};

export type HITLProperties = OptionalHITLProperties & MandatoryHITLProperties;

export type MandatoryHITLProperties = {
  confirmationId: string;
  /** The action being approved, already humanised — e.g. "Create discount". */
  title: string;
};

export type OptionalHITLProperties = {
  description?: string;
  /**
   * Labelled parameter blocks to show. When omitted, `functionArguments` is
   * formatted generically instead.
   */
  sections?: HITLSection[];
  /** Raw arguments, formatted generically when no `sections` are given. */
  functionArguments?: Record<string, unknown>;
  /** Argument keys (case-insensitive) hidden from the generic formatting. */
  hiddenKeys?: string[];
  onconfirm?: (event: HITLEvent) => void;
  /** @deprecated Use `onconfirm` instead; both work until 4.0.0. */
  onConfirm?: (event: HITLEvent) => void;
  confirmLabel?: string;
  cancelLabel?: string;
  /**
   * Seconds until the card auto-approves, with a sweep across the confirm
   * button. `0` disables auto-approval.
   */
  countdownSeconds?: number;
  /**
   * Seconds until an untouched card auto-rejects — for confirmations that must
   * not auto-approve (e.g. OAuth) but should not block a conversation forever.
   */
  autoCancelSeconds?: number;
  /** Current mic state — muted while the card is open, restored on decision. */
  isMicMuted?: boolean;
  onmictoggle?: (() => void | Promise<void>) | null;
  /** @deprecated Use `onmictoggle` instead; both work until 4.0.0. */
  onMicToggle?: (() => void | Promise<void>) | null;
  /** Renders a settled card from `initialState` with no timers or buttons. */
  isHistoryMode?: boolean;
  initialState?: HITLInitialState | null;
  approvedIcon?: Snippet;
  rejectedIcon?: Snippet;
  badgeLabel?: string;
  approvedLabel?: string;
  autoApprovedLabel?: string;
  rejectedLabel?: string;
  expiredLabel?: string;
  testId?: string;
  /** Override the confirm button's test id (default: `<testId>-confirm`). */
  confirmTestId?: string;
  /** Override the cancel button's test id (default: `<testId>-cancel`). */
  cancelTestId?: string;
  /** Override the completion strip's test id (default: `<testId>-completion`). */
  completionTestId?: string;
  /** Override the completion text's test id (default: `<testId>-completion-text`). */
  completionTextTestId?: string;
  classes?: string;
};
