import type { GlossaryEntry } from "./types";

// เรื่องเล่า (SPEC-006 § The matcher; the TASK-023 comp's rules, accepted by the SA): which words of a chapter's text are
// glossary terms the reader can tap. Verbatim only, never guessed inside a word:
// - every term and alias, longest first, so "Tech Lead" wins over "Lead" and "ความจำเต็ม" over "ความจำ";
// - a form that starts or ends with a Latin letter or digit matches only at a word edge ("Mid" not inside "Midway");
//   Thai has no word edges, so longest-first decides there;
// - only the first place of an entry in a chapter is marked; later places stay text and are consumed whole, so a
//   shorter form cannot match inside them.

/** A run of plain text, or a marked term: `term` is the form as written in the text, `entry` its glossary index. */
export type Segment = { text: string } | { term: string; entry: number };

const LATIN = /[A-Za-z0-9]/;

/** One chapter's text cut into plain runs and marked terms; joined back, the segments give the text unchanged. */
export function storySegments(text: string, glossary: readonly GlossaryEntry[]): Segment[] {
  const forms = glossary
    .flatMap((g, entry) => [g[0], ...(g[2] ?? [])].map((form) => ({ form, entry })))
    .filter(({ form }) => form.length > 0)
    .sort((x, y) => y.form.length - x.form.length);
  const at = (i: number) =>
    forms.find(({ form }) =>
      text.startsWith(form, i) &&
      !(LATIN.test(form[0]) && i > 0 && LATIN.test(text[i - 1])) &&
      !(LATIN.test(form[form.length - 1]) && LATIN.test(text[i + form.length] ?? "")));

  const out: Segment[] = [];
  const marked = new Set<number>();
  let plain = "";
  for (let i = 0; i < text.length; ) {
    const hit = at(i);
    if (!hit) {
      plain += text[i];
      i += 1;
      continue;
    }
    if (marked.has(hit.entry)) {
      plain += hit.form;
    } else {
      if (plain) out.push({ text: plain });
      plain = "";
      out.push({ term: hit.form, entry: hit.entry });
      marked.add(hit.entry);
    }
    i += hit.form.length;
  }
  if (plain) out.push({ text: plain });
  return out;
}

/** A box in viewport pixels, as `getClientRects()` gives one. */
export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * A tap that misses every term's text (SPEC-006 § Amendment, REQ-006 Q3 option a): the index of the term nearest the
 * point, if it is within `max` px; ties go to the lower index; else null. A term's distance is to the nearest of its
 * boxes (a wrapped term has one per line); the distance to a box is 0 inside it, else straight or diagonal to its edge.
 */
export function nearestTerm(point: { x: number; y: number }, terms: readonly { rects: readonly Box[] }[], max = 22): number | null {
  let best: number | null = null;
  let bestDistance = Infinity;
  terms.forEach((term, i) => {
    for (const r of term.rects) {
      const dx = Math.max(r.left - point.x, 0, point.x - r.right);
      const dy = Math.max(r.top - point.y, 0, point.y - r.bottom);
      const d = Math.hypot(dx, dy);
      if (d <= max && d < bestDistance) {
        best = i;
        bestDistance = d;
      }
    }
  });
  return best;
}

/** The open panel of each chapter (chapter index → panel id). One per chapter. */
export type OpenPanels = Readonly<Record<number, string>>;

/** A tap or Enter on a term: opens its panel (closing the chapter's other one); on the open term, closes it. */
export function togglePanel(open: OpenPanels, chapter: number, id: string): OpenPanels {
  const next = { ...open };
  if (next[chapter] === id) delete next[chapter];
  else next[chapter] = id;
  return next;
}

/** Esc: closes the focused term's panel if it is open, else every open panel. `focused` = the focused term's panel id. */
export function escapePanels(open: OpenPanels, focused: string | null): OpenPanels {
  const own = Object.keys(open).find((k) => open[Number(k)] === focused);
  if (own !== undefined) return togglePanel(open, Number(own), focused as string);
  return Object.keys(open).length ? {} : open;
}
