import { TechniqueRoute, techniqueMetadata } from "@/components/partials/site/routes";

// /techniques/<id> (SPEC-012 § Site map): one technique's card; an unknown id is a 404. Read the back on every request.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export function generateMetadata({ params }: Props) {
  return techniqueMetadata(params);
}

export default function Page({ params }: Props) {
  return <TechniqueRoute params={params} />;
}
