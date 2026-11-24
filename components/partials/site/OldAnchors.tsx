"use client";

import { useEffect } from "react";
import { oldAnchorTarget } from "@/lib/lab/site";

/** Old one-page links (SPEC-012 § Conventions, the redirect map). A hash never reaches the server, so `/` reads it on
 * load, and on every hash change while it is open (a hash typed or followed on an open `/`, TASK-050), and goes to the
 * section's new page with `location.replace`: the back button does not return to the hash and loop. `#answer`, an
 * empty hash and unknown hashes stay. Renders nothing. */
export function OldAnchors() {
  useEffect(() => {
    const go = () => {
      const target = oldAnchorTarget(location.hash);
      if (target) location.replace(target);
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, []);
  return null;
}
