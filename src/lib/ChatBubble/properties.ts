import type { Snippet } from 'svelte';

export type ChatBubblePosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export type ChatBubbleDragMode = 'snap' | 'free';

export type BubbleDrag = {
  startX: number;
  startY: number;
  baseX: number;
  baseY: number;
  moved: boolean;
  left0: number;
  top0: number;
  width: number;
  height: number;
};

export type ChatBubbleProperties = OptionalChatBubbleProperties & ChatBubbleEventProperties;

export type OptionalChatBubbleProperties = {
  open?: boolean;
  position?: ChatBubblePosition;
  label?: string;
  closeLabel?: string;
  icon?: Snippet;
  openIcon?: Snippet;
  children?: Snippet;
  draggable?: boolean;
  dragMode?: ChatBubbleDragMode;
  dragX?: number;
  dragY?: number;
  resizable?: boolean;
  panelWidth?: number;
  panelHeight?: number;
  minPanelWidth?: number;
  minPanelHeight?: number;
  expanded?: boolean;
  expandedPanelWidth?: number;
  expandedPanelHeight?: number;
  testId?: string;
  classes?: string;
};

export type ChatBubbleEventProperties = {
  onopen?: () => void;
  onOpen?: () => void;
  onclose?: () => void;
  onClose?: () => void;
  ontoggle?: (open: boolean) => void;
  onToggle?: (open: boolean) => void;
};
