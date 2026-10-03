import type { Snippet } from 'svelte';

export type DockPanelState = 'closed' | 'docked' | 'expanded';

export type DockPanelControls = {
  state: DockPanelState;
  expand: () => void;
  collapse: () => void;
  close: () => void;
};

export type DockPanelSnapshot = {
  state: DockPanelState;
  width: number;
};

export type DockPanelProperties = {
  state?: DockPanelState;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  /** Published layout reservation. Bind to observe; zero when closed or expanded. */
  reservedWidth?: number;
  label?: string;
  resizeLabel?: string;
  header?: Snippet<[DockPanelControls]>;
  body?: Snippet;
  footer?: Snippet;
  children?: Snippet;
  testId?: string;
  classes?: string;
  onstatechange?: (state: DockPanelState) => void;
  onwidthchange?: (width: number) => void;
};
