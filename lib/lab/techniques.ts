// เทคนิค (SPEC-003): which ประวัติ rows a technique links to, its group in Thai, and the open rows of ประวัติ that an
// evidence link opened on the one-page site (withRow, toggledRow: unused since SPEC-012, where an evidence link goes to
// /runs/<id>; kept with their tests). Pure functions.

/** A technique's `rows` that name a row on the page, in pack order. Missing `rows` → [] (pack v3.1, AC-7). */
export function evidenceRows(rows: readonly string[] | undefined, runs: readonly { id: string }[]): string[] {
  const ids = new Set(runs.map((r) => r.id));
  return (rows ?? []).filter((id) => ids.has(id));
}

/** `groups[group]`, or the key itself when page.techniques.groups does not name it (AC-7). */
export function groupName(groups: Record<string, string>, group: string): string {
  return Object.hasOwn(groups, group) ? groups[group] : group;
}

/** The evidence link: opens the row; a row already open stays open (the same set comes back). */
export function withRow(open: ReadonlySet<string>, id: string): ReadonlySet<string> {
  return open.has(id) ? open : new Set(open).add(id);
}

/** The ประวัติ entry button: opens a closed row, closes an open one. */
export function toggledRow(open: ReadonlySet<string>, id: string): ReadonlySet<string> {
  const next = new Set(open);
  if (!next.delete(id)) next.add(id);
  return next;
}
