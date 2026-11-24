import { Answer } from "@/components/partials/lab/Answer";
import type { AnswerPage } from "@/lib/lab/site";
import type { Page, Run } from "@/lib/lab/types";

/** Today's คำตอบ, unchanged, with each card's "▶ ดูคลิป" a real link to the run's คลิป tab (SPEC-012 § Conventions, § Rework
 * round 1). It gets only the card rows and the three parts of `page` it reads. */
export function AnswerLinks({ cards, page }: { cards: Run[]; page: AnswerPage }) {
  return <Answer runs={cards} page={page as Page} clipHref={(id) => `/runs/${id}?tab=clips`} />;
}
