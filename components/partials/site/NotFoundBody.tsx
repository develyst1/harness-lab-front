import Link from "next/link";
import { W } from "./words";

/** The site's not-found page (SPEC-012: a 404 page in Thai; the nav and the footer come from the layout), linking home. */
export function NotFoundBody() {
  return (
    <section className="site-404">
      <h1>{W.notFound}</h1>
      <p>
        <Link href="/">{W.backHome}</Link>
      </p>
    </section>
  );
}
