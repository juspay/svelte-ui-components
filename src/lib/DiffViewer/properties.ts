export type DiffViewerLine = {
  kind: 'add' | 'remove' | 'context';
  oldLine?: number;
  newLine?: number;
  text: string;
};

export type DiffViewerHunk = {
  header?: string;
  lines: DiffViewerLine[];
};

export type DiffViewerProperties = MandatoryDiffViewerProperties & OptionalDiffViewerProperties;

export type MandatoryDiffViewerProperties = {
  path: string;
  hunks: DiffViewerHunk[];
  additions: number;
  deletions: number;
};

export type OptionalDiffViewerProperties = {
  created?: boolean;
  /** Diffs with more lines start collapsed. Updates to the total reset this state. */
  collapseThreshold?: number;
  classes?: string;
  /** Value for `data-pw` on the trigger/header (forwarded to Accordion's own root). */
  testId?: string;
};
