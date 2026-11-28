import type { JSONValue } from 'type-decoder';

export type TableProperties = {
  tableTitle: string | null;
  tableHeaders: string[];
  tableData: Array<JSONValue[]>;
  isTableScrollable: boolean;
  isContentScrollable: boolean;
};
