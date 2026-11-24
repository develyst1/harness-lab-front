import { RunRoute, runMetadata } from "@/components/partials/site/routes";

// /runs/<id> (SPEC-012 § Site map): one run, its tab in ?tab=; an unknown id is a 404. Read the back on every request.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export function generateMetadata({ params }: Props) {
  return runMetadata(params);
}

export default function Page({ params, searchParams }: Props) {
  return <RunRoute params={params} searchParams={searchParams} />;
}
