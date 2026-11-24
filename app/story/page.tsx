import type { Metadata } from "next";
import { StoryRoute } from "@/components/partials/site/routes";
import { areaLabel, pageTitle } from "@/components/partials/site/words";

// /story (SPEC-012 § Site map): the chapters with their glossary taps; the home's chapter links land on #chapter-<n>.
// Read the back on every request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: pageTitle(areaLabel("story")) };

export default function Page() {
  return <StoryRoute />;
}
