import type { Snippet } from 'svelte';

export type ChatComposerProperties = OptionalChatComposerProperties & ChatComposerEventProperties;

export type OptionalChatComposerProperties = {
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  submitOnEnter?: boolean;
  maxLength?: number;
  streaming?: boolean;
  recording?: boolean;
  attachments?: File[];
  accept?: string;
  multiple?: boolean;
  sendLabel?: string;
  stopLabel?: string;
  voiceLabel?: string;
  attachLabel?: string;
  sendIcon?: Snippet;
  stopIcon?: Snippet;
  voiceIcon?: Snippet;
  attachIcon?: Snippet;
  leading?: Snippet;
  testId?: string;
  classes?: string;
};

export type ChatComposerEventProperties = {
  onsubmit?: (value: string, attachments: File[]) => void;
  oninput?: (value: string, event: Event) => void;
  onkeydown?: (event: KeyboardEvent) => void;
  onstop?: () => void;
  onvoice?: () => void;
  onattach?: (files: File[]) => void;
};
