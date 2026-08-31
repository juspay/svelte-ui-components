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
  onMoveStart?: (position: DragPosition) => void;
  onMove?: (position: DragPosition) => void;
  onMoveEnd?: (position: DragPosition) => void;
};
