import type { Metadata } from "next";
import { AboutRoute } from "@/components/partials/site/routes";
import { areaLabel, pageTitle } from "@/components/partials/site/words";

// /about (SPEC-012 § Site map): today's เบื้องหลัง (how it was built). Read the back on every request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: pageTitle(areaLabel("about")) };

export default function Page() {
  return <AboutRoute />;
}
