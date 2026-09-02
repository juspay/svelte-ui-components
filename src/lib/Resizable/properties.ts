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
  onResize?: (size: ResizeSize) => void;
  onresizestart?: (size: ResizeSize) => void;
  onResizeStart?: (size: ResizeSize) => void;
  onresizeend?: (size: ResizeSize) => void;
  onResizeEnd?: (size: ResizeSize) => void;
};
