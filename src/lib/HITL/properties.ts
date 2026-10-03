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
  /** The `value` of the extra action that settled the card, when one did. */
  value?: string;
  /** The text submitted through an `'ask-for-text'` extra action. */
  message?: string;
  /** Set when the card was settled by answering `questions`. */
  answers?: HITLQuestionAnswer[];
};

export type HITLQuestionOption = {
  label: string;
  /** Shown as the option's hover tooltip. */
  description?: string;
};

export type HITLQuestion = {
  /** Short name for the question, e.g. "Auth method". */
  header?: string;
  question: string;
  options: HITLQuestionOption[];
  /** Any number of options may be picked. Default `false`: one at most. */
  multiSelect?: boolean;
};

export type HITLQuestionAnswer = {
  header?: string;
  question: string;
  picks: string[];
};

export type HITLInitialState = {
  approved?: boolean;
  /** `'EXPIRED'` renders the timed-out completion state. */
  status?: string;
};

export type HITLExtraActionBase = {
  label: string;
  /** `data-pw` for this action's button (default: `<testId>-action-<index>`). */
  testId?: string;
  /** Class string on this action's Button, e.g. to pick a variant. */
  classes?: string;
  /** Accessible name for this action's Button, when `label` alone isn't descriptive enough. */
  ariaLabel?: string;
};

/**
 * The default kind: a side path beside confirm/cancel, e.g. opening the
 * caller's own compose panel. Selecting one does NOT settle the card: no
 * completion state, no `onconfirm`. It only pauses the countdown (own and
 * siblings', like any other interaction) and calls `onSelect`. Settling, if
 * any, is the caller's job.
 */
export type HITLSideExtraAction = HITLExtraActionBase & {
  kind?: 'side';
  onSelect: () => void;
};

/**
 * A decision with its own label: settles the card as `settleAs`, exactly like
 * confirm/cancel, with `value` carried on the `onconfirm` event so the caller
 * can tell several same-`settleAs` decisions apart (e.g. plan-approval modes).
 */
export type HITLDecisionExtraAction = HITLExtraActionBase & {
  kind: 'decision';
  settleAs: HITLAction;
  value?: string;
};

/**
 * Asks for text before deciding: opens a reply box inside the card in place of
 * the action row. Submitting settles as `settleAs` with the text on
 * `HITLEvent.message`; the Back button closes the box without settling.
 */
export type HITLAskForTextExtraAction = HITLExtraActionBase & {
  kind: 'ask-for-text';
  settleAs: HITLAction;
  value?: string;
  placeholder?: string;
  /** Default `'Send'`. */
  submitLabel?: string;
  /** Class string on the Send button, e.g. a danger variant for a deny. */
  submitClasses?: string;
  /** Default `'Back'`. */
  backLabel?: string;
  /**
   * A growing textarea (3-10 rows) instead of a one-line input, for a reply
   * that can run to paragraphs. Enter then adds a line; Send or
   * Ctrl/Cmd+Enter sends. Default `false`.
   */
  multiline?: boolean;
};

export type HITLExtraAction =
  | HITLSideExtraAction
  | HITLDecisionExtraAction
  | HITLAskForTextExtraAction;

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
  /**
   * Rich parameter detail replacing sections/arguments in pending and resolved
   * cards, including history. Unlike children, this remains after a decision.
   */
  details?: Snippet;
  /** Raw arguments, formatted generically when no `sections` are given. */
  functionArguments?: Record<string, unknown>;
  /** Argument keys (case-insensitive) hidden from the generic formatting. */
  hiddenKeys?: string[];
  /** Awaited before completion; throwing/rejecting leaves the card pending for retry. */
  onconfirm?: (event: HITLEvent) => void | Promise<void>;
  confirmLabel?: string;
  /** Blocks manual and timed approval while leaving rejection available. Defaults to false. */
  confirmDisabled?: boolean;
  cancelLabel?: string;
  /** Hides the cancel button entirely — for a card whose only real dispositions come through `actions`. Default `true`. */
  showCancel?: boolean;
  /**
   * Hides the confirm button — for a card whose only real dispositions come
   * through `actions` (e.g. several labelled `'decision'` actions). The
   * countdown sweep lives on that button, so pair it with `countdownSeconds={0}`.
   * Default `true`.
   */
  showConfirm?: boolean;
  /**
   * A card with nothing to list (no `sections`, and no `functionArguments`
   * that survive `hiddenKeys`) shows a "PARAMETERS / No parameters"
   * placeholder. `false` hides it -- for a card whose body is its own
   * `children` (a plan, say) and genuinely has no parameters to show.
   * Supplying `children` does not hide it by itself. A card that asks
   * `questions` never shows it, either way. Default `true`.
   */
  showEmptyParameters?: boolean;
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
  /**
   * Extra actions rendered between cancel and confirm. By default each is a
   * side path that does not settle the card; `kind: 'decision'` and
   * `kind: 'ask-for-text'` settle it. See `HITLExtraAction`.
   */
  actions?: HITLExtraAction[];
  /**
   * Questions answered by picking options inside the card. By default picks
   * are collected (a single-select question toggles like a radio, a
   * multi-select one like checkboxes) and the Send-answers button — enabled
   * once every question has a pick — settles the card as `questionsSettleAs`
   * with every question's picks on `HITLEvent.answers`.
   */
  questions?: HITLQuestion[];
  /**
   * Settle as soon as a single-select option is clicked, with only that
   * question's answer. Multi-select questions still collect picks, and Send
   * then needs only those. Default `false`.
   */
  answerOnSelect?: boolean;
  /** What answering `questions` settles the card as. Default `'approved'`. */
  questionsSettleAs?: HITLAction;
  /** Default `'Send answers'`. */
  sendAnswersLabel?: string;
  /** Class string on every question option's Button, e.g. a chip recipe. */
  optionClasses?: string;
  /** Added to a picked option's Button, after `optionClasses`. */
  selectedOptionClasses?: string;
  /**
   * Arbitrary extra controls — free-text input, multi-select chips — rendered
   * in the body above the action row while the card is pending. Never shown
   * once the card is completed or in history mode.
   */
  children?: Snippet;
  classes?: string;
};
