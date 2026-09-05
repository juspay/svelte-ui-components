import type { Snippet } from 'svelte';

export type ResizeEdge =
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export type ResizeSize = {
  width: number;
  height: number;
};

export type ResizableProperties = OptionalResizableProperties & ResizableEventProperties;

export type OptionalResizableProperties = {
  width?: number | null;
  height?: number | null;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  handles?: ResizeEdge[];
  step?: number;
  disabled?: boolean;
  handleLabel?: string;
  children?: Snippet;
  testId?: string;
  classes?: string;
};

export type ResizableEventProperties = {
  onresize?: (size: ResizeSize) => void;
  /** @deprecated Use `onresize` instead; both work until 4.0.0. */
  onResize?: (size: ResizeSize) => void;
  onresizestart?: (size: ResizeSize) => void;
  /** @deprecated Use `onresizestart` instead; both work until 4.0.0. */
  onResizeStart?: (size: ResizeSize) => void;
  onresizeend?: (size: ResizeSize) => void;
  /** @deprecated Use `onresizeend` instead; both work until 4.0.0. */
  onResizeEnd?: (size: ResizeSize) => void;
};
