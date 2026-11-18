import type { Item, Run } from "./types";

/** The item a คำตอบ card shows: the row's `items[0]` (SPEC-001 § Pack v2), or null for a row with no items. */
export function firstItem(row: Run): Item | null {
  return row.items[0] ?? null;
}
