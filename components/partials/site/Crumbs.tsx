import Link from "next/link";
import { W } from "./words";

/** Breadcrumbs on a detail page (SPEC-012 § Conventions): หน้าแรก › การเช่า › R10; the last one is the page itself. */
export function Crumbs({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <nav className="site-crumbs" aria-label={W.crumbs}>
      <ol>
        {trail.map((c, i) => (
          <li key={i}>
            {c.href ? <Link href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
