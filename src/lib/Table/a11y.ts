import type { TableCellValue, TableColumn } from './properties';

const controlTypes = new Set(['input', 'select', 'toggle', 'button', 'action-group', 'popup-menu']);

/** Readable row context, independent of editable/selected control values. */
export function rowContextLabel(
  row: readonly TableCellValue[],
  originalIndex: number,
  columns?: readonly TableColumn[]
): string {
  for (const [index, value] of row.entries()) {
    if (controlTypes.has(columns?.[index]?.type ?? '')) {
      continue;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
    if (typeof value === 'number') {
      return String(value);
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const key of ['text1', 'text', 'label', 'title', 'name']) {
        const text = value[key];
        if (typeof text === 'string' && text.trim() !== '') {
          return text;
        }
      }
    }
  }
  return `row ${originalIndex + 1}`;
}

/** Constructed once per data projection, then read without mutation by Table. */
export function rowContextLabels(
  rows: readonly TableCellValue[][],
  columns?: readonly TableColumn[]
): ReadonlyMap<TableCellValue[], string> {
  const captions = rows.map((row, index) => rowContextLabel(row, index, columns));
  const counts = new Map<string, number>();
  for (const label of captions) {
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return new Map(
    rows.map((row, index) => [
      row,
      (counts.get(captions[index]) ?? 0) > 1
        ? `${captions[index]}, record ${index + 1}`
        : captions[index]
    ])
  );
}

/** Opaque per-instance IDs: distinct raw keys never collapse through slugging. */
export function selectionControlIds(instanceId: string) {
  const rows = new Map<string, string>();
  const owners = new Map<string, string>();
  const headerId = `table-${instanceId}-select-all`;
  owners.set(headerId, 'header');
  let sequence = 0;

  const rowId = (key: string): string => {
    let id = rows.get(key);
    if (typeof id !== 'string') {
      do {
        id = `table-${instanceId}-row-selection-${++sequence}`;
      } while (owners.has(id));
      rows.set(key, id);
      owners.set(id, `row:${key}`);
    }
    return id;
  };

  return (key: string, header: boolean, requestedId?: string): string => {
    const owner = header ? 'header' : `row:${key}`;
    const generated = header ? headerId : rowId(key);
    // Valid caller IDs remain usable for external labels/CSS. Invalid or conflicting
    // IDs fall back to the managed ID; ownership persists across filter/page changes.
    if (
      typeof requestedId === 'string' &&
      requestedId !== '' &&
      !/\s/.test(requestedId) &&
      (!owners.has(requestedId) || owners.get(requestedId) === owner)
    ) {
      owners.set(requestedId, owner);
      return requestedId;
    }
    return generated;
  };
}
