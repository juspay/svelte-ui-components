import type { JSONValue } from 'type-decoder';

type Row = JSONValue[];

export function projectRowOccurrences(rows: Row[]): { data: Row[]; originals: Map<Row, Row> } {
  const originals = new Map<Row, Row>();
  const seen = new Set<Row>();
  let data = rows;
  for (const [index, row] of rows.entries()) {
    if (seen.has(row)) {
      // Duplicate references still represent separate render and source-index occurrences.
      if (data === rows) {
        data = [...rows];
      }
      const projected = [...row];
      data[index] = projected;
      originals.set(projected, row);
    } else {
      seen.add(row);
    }
  }
  return { data, originals };
}

export function uniqueRenderKeys(
  rows: Row[],
  ids: ReadonlyMap<Row, string>
): Map<Row, string | Row> {
  const seen = new Set<string>();
  return new Map<Row, string | Row>(
    rows.map((row) => {
      const id = ids.get(row);
      if (typeof id !== 'string' || seen.has(id)) {
        return [row, row];
      }
      seen.add(id);
      return [row, id];
    })
  );
}
