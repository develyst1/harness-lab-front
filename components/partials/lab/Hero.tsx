import type { Page } from "@/lib/lab/types";

// Layout: reference/index.html lines 225–231. Text: page.json → hero.
export function Hero({ hero }: { hero: Page["hero"] }) {
  return (
    <header className="hero">
      <div className="run">{hero.kicker}</div>
      <h1>{hero.title}</h1>
      <p>{hero.lead}</p>
      <div className="who">{hero.byline}</div>
    </header>
  );
}
