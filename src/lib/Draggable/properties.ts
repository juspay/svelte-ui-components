import type { Snippet } from 'svelte';

export type DragAxis = 'both' | 'x' | 'y';
export type DragBounds = 'viewport' | null;

export type DragPosition = {
  x: number;
  y: number;
};

export type DraggableProperties = OptionalDraggableProperties & DraggableEventProperties;

export type OptionalDraggableProperties = {
  x?: number;
  y?: number;
  axis?: DragAxis;
  handle?: string;
  bounds?: DragBounds;
  disabled?: boolean;
  step?: number;
  dragLabel?: string;
  children?: Snippet;
  testId?: string;
  classes?: string;
};

export type DraggableEventProperties = {
  onmovestart?: (position: DragPosition) => void;
  /** @deprecated Use `onmovestart` instead; both work until 4.0.0. */
  onMoveStart?: (position: DragPosition) => void;
  onmove?: (position: DragPosition) => void;
  /** @deprecated Use `onmove` instead; both work until 4.0.0. */
  onMove?: (position: DragPosition) => void;
  onmoveend?: (position: DragPosition) => void;
  /** @deprecated Use `onmoveend` instead; both work until 4.0.0. */
  onMoveEnd?: (position: DragPosition) => void;
};
