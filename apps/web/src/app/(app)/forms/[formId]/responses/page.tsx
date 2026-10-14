import { FormResponses } from "~/components/forms/form-responses";

export default async function FormResponsesPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  return <FormResponses formId={formId} />;
}
