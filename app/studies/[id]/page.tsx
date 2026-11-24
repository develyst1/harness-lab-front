import { StudyRoute, studyMetadata } from "@/components/partials/site/routes";

// /studies/<id> (SPEC-012 § Site map): REQ-010's study, Meeting.tsx unchanged; only r-m1, else a 404. Read the back on
// every request.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export function generateMetadata({ params }: Props) {
  return studyMetadata(params);
}

export default function Page({ params }: Props) {
  return <StudyRoute params={params} />;
}
