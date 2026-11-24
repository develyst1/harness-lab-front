"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { homeHref, type SearchEntry, type Sort, searchHits } from "@/lib/lab/site";
import { W } from "./words";

/** The home's search box (SPEC-012, AC-1 pick 1): the runs' and techniques' titles, searched in the browser. Its text
 * lives in `?q=` (D1): it starts from the URL and replaces it as you type, keeping a `sort` the URL has. Each hit is a
 * link to its page; the count is announced politely. */
export function SiteSearch({ index, initial, sort }: { index: SearchEntry[]; initial: string; sort?: Sort }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const id = useId();
  const hits = searchHits(index, q);
  const change = (value: string) => {
    setQ(value);
    router.replace(homeHref(value, sort), { scroll: false });
  };
  return (
    <div className="site-search" role="search">
      <label htmlFor={id}>{W.search}</label>
      <input id={id} type="search" value={q} onChange={(e) => change(e.target.value)} autoComplete="off" />
      <div aria-live="polite">
        {q.trim() && hits.length === 0 && <p className="mute">{W.searchNone}</p>}
        {hits.length > 0 && (
          <ul>
            {hits.map((h) => (
              <li key={`${h.kind}-${h.id}`}>
                <Link href={`/${h.kind === "run" ? "runs" : "techniques"}/${h.id}`}>
                  <span className="site-kind">{W.kind[h.kind]}</span>
                  <b>{h.id}</b> {h.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
