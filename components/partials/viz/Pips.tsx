// SPEC-013 viz: n of a few, as pips. A caught pip is filled, a missed one is hollow, and a half (1.5 of 3) is half
// filled: the shape differs, not only the colour (AC-5). The count follows as text.
export function Pips({ n, of, text, aria }: { n: number; of: number; text: string; aria: string }) {
  return (
    <span className="vz-pips" role="img" aria-label={aria}>
      {Array.from({ length: of }, (_, i) => (
        <i key={i} className={i + 1 <= n ? "y" : i < n ? "h" : "n"} />
      ))}
      <span className="num">{text}</span>
    </span>
  );
}
