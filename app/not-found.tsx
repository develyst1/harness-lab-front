import { NotFoundBody } from "@/components/partials/site/NotFoundBody";

// Any unknown URL, and every notFound() (an unknown run id, …): the Thai not-found line; the nav and the footer come from
// the root layout.
export default function NotFound() {
  return <NotFoundBody />;
}
